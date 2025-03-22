"use client";

import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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

interface PortfolioVisualizationProps {
  portfolio: PortfolioData;
}

export function PortfolioVisualization({ portfolio }: PortfolioVisualizationProps) {
  if (!portfolio || !portfolio.assets) {
    return (
      <div className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="text-center py-4 text-gray-400">
          No portfolio data available
        </div>
      </div>
    );
  }

  // Function to generate colors for assets (for colored dots in the list)
  function getColorForAsset(symbol: string): string {
    const colorMap: Record<string, string> = {
      APT: "#09f",
      BTC: "#f7931a",
      ETH: "#627eea",
      USDC: "#2775ca",
      USDT: "#26a17b",
      // Add more colors as needed
    };

    return colorMap[symbol] || `hsl(${Math.random() * 360}, 70%, 60%)`;
  }

  // Total portfolio value formatting
  const formattedTotalValue = formatNumber(portfolio.totalValue, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  // Calculate percentage changes
  const change24hFormatted = portfolio.change24h
    ? formatNumber(portfolio.change24h / 100, {
        style: "percent",
        maximumFractionDigits: 2,
        signDisplay: "always",
      })
    : "--";

  return (
    <div className="space-y-3 w-full">
      {/* Overview Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
        <div className="text-sm font-medium mb-2">Portfolio Overview</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <div className="text-sm text-gray-400">Total Value</div>
            <div className="text-xl font-bold">{formattedTotalValue}</div>
            {portfolio.change24h !== null && (
              <div
                className={`text-xs flex items-center gap-1 ${
                  portfolio.change24h >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {portfolio.change24h >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                <span>{change24hFormatted} (24h)</span>
              </div>
            )}
          </div>

          {/* Risk Score */}
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Risk Profile</span>
              <span className="font-medium">
                {getRiskLabel(portfolio.riskScore)}
              </span>
            </div>
            <Progress value={portfolio.riskScore} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
        <div className="text-sm font-medium p-3 border-b border-gray-800">Assets</div>
        <div className="divide-y divide-gray-800">
          {portfolio.assets.map((asset, index) => {
            const percentage = (asset.value / portfolio.totalValue) * 100;
            const assetColor = getColorForAsset(asset.symbol);

            return (
              <div key={`${asset.symbol}-${index}`} className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2.5">
                  {asset.logoUrl ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                      <img
                        src={asset.logoUrl}
                        alt={asset.symbol}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: assetColor }}>
                      <Wallet size={12} className="h-full w-full p-1.5 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-xs">{asset.symbol}</div>
                    <div className="text-xs text-gray-400">{asset.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-xs">
                    {formatNumber(asset.value, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="flex text-xs text-gray-400 justify-end gap-1">
                    <span>
                      {formatNumber(asset.balance)} {asset.symbol}
                    </span>
                    <span className="text-gray-500">
                      ({formatNumber(percentage / 100, {
                        style: "percent",
                        maximumFractionDigits: 1,
                      })})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategies List (if available) */}
      {portfolio.strategies && portfolio.strategies.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          <div className="text-sm font-medium p-3 border-b border-gray-800">Strategies</div>
          <div className="divide-y divide-gray-800">
            {portfolio.strategies.map((strategy, index) => (
              <div key={`${strategy.name}-${index}`} className="flex items-center justify-between p-2.5">
                <div>
                  <div className="font-medium text-xs">{strategy.name}</div>
                  <div className="text-xs text-gray-400">{strategy.protocol}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-xs">
                    {formatNumber(strategy.value, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-emerald-500">
                    {formatNumber(strategy.apy / 100, {
                      style: "percent",
                      maximumFractionDigits: 2,
                    })} APY
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get risk label based on score
function getRiskLabel(score: number): string {
  if (score < 20) return "Very Conservative";
  if (score < 40) return "Conservative";
  if (score < 60) return "Moderate";
  if (score < 80) return "Aggressive";
  return "Very Aggressive";
}
