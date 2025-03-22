import { NextRequest, NextResponse } from "next/server";
import { getUserByWalletAddress } from "@/lib/wallet-service";

// Define DeFi protocols with real APY rates and risk classifications
const APTOS_DEFI_PROTOCOLS = {
  liquidStaking: [
    { name: "Amnis Finance", apy: 7.5, protocol: "amnisStake", risk: "Low", minAmount: 0.1 },
    { name: "Tortuga Finance", apy: 7.8, protocol: "tortugaStake", risk: "Low", minAmount: 0.1 },
    { name: "Ditto Finance", apy: 7.6, protocol: "dittoStake", risk: "Low", minAmount: 0.1 },
  ],
  lending: [
    { name: "AnimeSwap", apy: 6.2, protocol: "animeSwapLend", risk: "Low-Medium", minAmount: 1 },
    { name: "Abel Finance", apy: 4.8, protocol: "abelLend", risk: "Low-Medium", minAmount: 5 },
    { name: "Aries Markets", apy: 8.5, protocol: "ariesLend", risk: "Medium", minAmount: 10 },
  ],
  liquidity: [
    { name: "PancakeSwap", apy: 11.2, protocol: "pancakeLP", risk: "Medium", pairs: ["APT-USDC", "APT-USDT"], minAmount: 10 },
    { name: "Thala Labs", apy: 15.5, protocol: "thalaLP", risk: "Medium-High", pairs: ["APT-USDC", "APT-tAPT"], minAmount: 5 },
    { name: "Econia", apy: 9.7, protocol: "econiaLP", risk: "Medium", pairs: ["APT-USDC"], minAmount: 5 },
  ],
  farming: [
    { name: "Merkle", apy: 32.4, protocol: "merkleFarm", risk: "High", minAmount: 25 },
    { name: "Pontem", apy: 21.8, protocol: "pontemFarm", risk: "Medium-High", minAmount: 20 },
    { name: "Hippo", apy: 18.3, protocol: "hippoFarm", risk: "Medium-High", minAmount: 15 },
  ]
};

interface Asset {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  priceUsd: number;
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

interface OptimizationOpportunity {
  title: string;
  description: string;
  potentialGain: string;
  risk: string;
  apy: number;
  protocol: string;
}

interface PortfolioData {
  assets: Asset[];
  strategies: Strategy[];
  riskScore: number;
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const user = await getUserByWalletAddress(walletAddress);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get portfolio data
    const portfolioResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/user/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });

    if (!portfolioResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch portfolio data" },
        { status: 500 }
      );
    }

    const portfolioData = await portfolioResponse.json() as PortfolioData;
    const { assets, strategies } = portfolioData;

    // Get user risk profile
    const userRiskTolerance = user.riskProfile?.riskTolerance || 5; // Default to moderate

    // Determine which optimization opportunities to show based on user assets and risk profile
    const opportunities: OptimizationOpportunity[] = [];

    // Helper to calculate yearly gain
    const calculateYearlyGain = (value: number, currentApy: number, newApy: number) => {
      return value * (newApy - (currentApy || 0)) / 100;
    };

    // Check for APT in assets for liquid staking opportunities
    const aptAsset = assets.find((a: Asset) => a.symbol === "APT");
    if (aptAsset && aptAsset.value > 10) {
      // Find if user already has a staking strategy
      const existingStakingStrategy = strategies.find((s: Strategy) =>
        s.name.includes("Staking") || s.protocol.includes("Stake")
      );

      // Get most appropriate liquid staking option based on user risk
      const liquidStakingOptions = APTOS_DEFI_PROTOCOLS.liquidStaking.filter(p =>
        (p.risk === "Low" && userRiskTolerance <= 6) ||
        userRiskTolerance > 6
      );

      if (liquidStakingOptions.length > 0) {
        // Sort by APY and get the best option
        const bestLiquidStaking = liquidStakingOptions.sort((a, b) => b.apy - a.apy)[0];

        // Calculate potential gain (accounting for existing strategies)
        const currentApy = existingStakingStrategy?.apy || 0;
        const utilizableApt = aptAsset.value * 0.7; // Assume 70% can be used for staking
        const yearlyGain = calculateYearlyGain(utilizableApt, currentApy, bestLiquidStaking.apy);

        if (yearlyGain > 5) { // Only show if there's meaningful gain
          opportunities.push({
            title: `${bestLiquidStaking.name} Liquid Staking`,
            description: `Convert APT to liquid staked tokens for ${bestLiquidStaking.apy}% APY while maintaining liquidity.`,
            potentialGain: `+$${yearlyGain.toFixed(2)}/year`,
            risk: bestLiquidStaking.risk,
            apy: bestLiquidStaking.apy,
            protocol: bestLiquidStaking.protocol
          });
        }
      }
    }

    // Check for stablecoin lending opportunities
    const stablecoins = assets.filter((a: Asset) => ["USDC", "USDT", "DAI"].includes(a.symbol));
    if (stablecoins.length > 0) {
      // Sum up total stablecoin value
      const totalStablecoinValue = stablecoins.reduce((sum: number, asset: Asset) => sum + asset.value, 0);

      if (totalStablecoinValue > 5) {
        // Find appropriate lending options based on risk tolerance
        const lendingOptions = APTOS_DEFI_PROTOCOLS.lending.filter(p =>
          (p.risk === "Low-Medium" && userRiskTolerance <= 5) ||
          (p.risk === "Medium" && userRiskTolerance > 5)
        );

        if (lendingOptions.length > 0) {
          // Sort by APY and get the best option
          const bestLending = lendingOptions.sort((a, b) => b.apy - a.apy)[0];

          // Check if user already has a lending strategy
          const existingLendingStrategy = strategies.find((s: Strategy) =>
            s.name.includes("Lending") || s.protocol.includes(bestLending.name)
          );

          // Calculate potential gain
          const currentApy = existingLendingStrategy?.apy || 0;
          const yearlyGain = calculateYearlyGain(totalStablecoinValue, currentApy, bestLending.apy);

          if (yearlyGain > 3) { // Only show if there's meaningful gain
            opportunities.push({
              title: `${stablecoins[0].symbol} Lending`,
              description: `Lend your ${stablecoins[0].symbol} for ${bestLending.apy}% APY on ${bestLending.name}.`,
              potentialGain: `+$${yearlyGain.toFixed(2)}/year`,
              risk: bestLending.risk,
              apy: bestLending.apy,
              protocol: bestLending.protocol
            });
          }
        }
      }
    }

    // Liquidity Pool opportunities if user has multiple assets
    if (assets.length >= 2 && userRiskTolerance >= 4) {
      // Find assets with significant value
      const significantAssets = assets.filter((a: Asset) => a.value > 20);

      if (significantAssets.length >= 2) {
        // Filter LP options by risk tolerance
        const lpOptions = APTOS_DEFI_PROTOCOLS.liquidity.filter(p =>
          (p.risk === "Medium" && userRiskTolerance <= 7) ||
          (p.risk === "Medium-High" && userRiskTolerance > 7)
        );

        if (lpOptions.length > 0) {
          // Sort by APY and get the best option
          const bestLP = lpOptions.sort((a, b) => b.apy - a.apy)[0];

          // Check if user already has an LP strategy for this pair
          const existingLpStrategy = strategies.find((s: Strategy) =>
            s.name.includes("Liquidity") || s.protocol.includes(bestLP.name)
          );

          // Calculate potential gain
          const asset1 = significantAssets[0];
          const asset2 = significantAssets[1];
          const lpCapital = Math.min(asset1.value, asset2.value) * 1.5; // LP capital potential
          const currentApy = existingLpStrategy?.apy || 0;
          const yearlyGain = calculateYearlyGain(lpCapital, currentApy, bestLP.apy);

          if (yearlyGain > 10) { // Only show if there's meaningful gain
            opportunities.push({
              title: `${asset1.symbol}-${asset2.symbol} Liquidity Pool`,
              description: `Provide liquidity to ${bestLP.name} ${asset1.symbol}-${asset2.symbol} pool for ${bestLP.apy}% APY.`,
              potentialGain: `+$${yearlyGain.toFixed(2)}/year`,
              risk: bestLP.risk,
              apy: bestLP.apy,
              protocol: bestLP.protocol
            });
          }
        }
      }
    }

    // Add high-risk farming opportunities for risk-seeking users
    if (userRiskTolerance >= 8 && assets.some((a: Asset) => a.value > 50)) {
      const farmingOptions = APTOS_DEFI_PROTOCOLS.farming.sort((a, b) => b.apy - a.apy);

      if (farmingOptions.length > 0) {
        const bestFarming = farmingOptions[0];
        const farmableAsset = assets.find((a: Asset) => a.value > 50);

        if (farmableAsset) {
          const farmableAmount = farmableAsset.value * 0.4; // Assume 40% can be used for farming
          const yearlyGain = (farmableAmount * bestFarming.apy / 100);

          opportunities.push({
            title: `${bestFarming.name} Yield Farming`,
            description: `Stake ${farmableAsset.symbol} in ${bestFarming.name} farming protocol for high ${bestFarming.apy}% APY returns.`,
            potentialGain: `+$${yearlyGain.toFixed(2)}/year`,
            risk: bestFarming.risk,
            apy: bestFarming.apy,
            protocol: bestFarming.protocol
          });
        }
      }
    }

    // Sort opportunities by potential gain (highest first)
    opportunities.sort((a, b) => {
      const gainA = parseFloat(a.potentialGain.replace('+$', '').replace('/year', ''));
      const gainB = parseFloat(b.potentialGain.replace('+$', '').replace('/year', ''));
      return gainB - gainA;
    });

    // Take top 3 opportunities
    const topOpportunities = opportunities.slice(0, 3);

    return NextResponse.json(topOpportunities);
  } catch (error) {
    console.error("Error generating optimization opportunities:", error);
    return NextResponse.json(
      { error: "Failed to generate optimization opportunities" },
      { status: 500 }
    );
  }
}
