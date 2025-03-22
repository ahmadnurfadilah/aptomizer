import { tool } from "ai";
import { z } from "zod";
import axios from "axios";

// Define types for portfolio data
interface Asset {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  priceUsd: number;
  change24h: number | null;
  apy: number | null;
  logoUrl: string;
}

interface Strategy {
  name: string;
  protocol: string;
  balance: number;
  value: number;
  apy: number;
  timeLeft: string | null;
  health: string;
}

interface PortfolioData {
  aiWalletAddress: string;
  totalValue: number;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  riskScore: number;
  assets: Asset[];
  strategies: Strategy[];
}

export const getPortfolio = tool({
  description: "Get the user's portfolio data including assets, strategies, and portfolio metrics",
  parameters: z.object({
    walletAddress: z.string().describe("The user's wallet address that was used to connect to the app"),
  }),
  execute: async ({ walletAddress }) => {
    try {
      // Make request to the portfolio API endpoint
      const response = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/portfolio`, {
        walletAddress
      });

      const portfolioData = response.data as PortfolioData;

      return {
        status: "success",
        portfolio: {
          aiWalletAddress: portfolioData.aiWalletAddress,
          totalValue: portfolioData.totalValue,
          change24h: portfolioData.change24h,
          change7d: portfolioData.change7d,
          change30d: portfolioData.change30d,
          riskScore: portfolioData.riskScore,
          assets: portfolioData.assets.map((asset: Asset) => ({
            name: asset.name,
            symbol: asset.symbol,
            balance: asset.balance,
            value: asset.value,
            priceUsd: asset.priceUsd,
            change24h: asset.change24h,
            apy: asset.apy,
            logoUrl: asset.logoUrl,
          })),
          strategies: portfolioData.strategies.map((strategy: Strategy) => ({
            name: strategy.name,
            protocol: strategy.protocol,
            balance: strategy.balance,
            value: strategy.value,
            apy: strategy.apy,
            timeLeft: strategy.timeLeft,
            health: strategy.health,
          })),
        },
      };
    } catch (error: Error | unknown) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: error instanceof Error && 'code' in error ? (error as {code?: string}).code : 'UNKNOWN_ERROR',
      };
    }
  },
});
