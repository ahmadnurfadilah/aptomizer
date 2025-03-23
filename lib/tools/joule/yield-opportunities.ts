import { tool } from "ai";
import { z } from "zod";

// Interface for pool data based on actual API response
interface PoolAsset {
  asset: {
    type: string;
    displayName?: string;
    assetName?: string;
    icon?: string;
    faAddress?: string;
    ltv?: number;  // LTV in asset object
  };
  ltv?: string;  // LTV as string in main object
  marketSize?: string;
  totalBorrowed?: string;
  depositApy?: number;
  borrowApy?: number;
  extraAPY?: {
    depositAPY?: string;
    borrowAPY?: string;
    stakingAPY?: string;
  };
  priceInfo?: {
    price?: number;
    currency?: string;
  };
}

export const jouleYieldOpportunities = tool({
  description: "Find the best yield opportunities in Joule Finance based on the user's risk profile",
  parameters: z.object({
    riskTolerance: z.number().min(1).max(10).optional().describe("User's risk tolerance on a scale of 1-10"),
    timeHorizon: z.enum(["Short", "Medium", "Long"]).optional().describe("User's investment time horizon"),
    minAPY: z.number().optional().describe("Minimum APY the user is looking for"),
    preferredAssets: z.array(z.string()).optional().describe("List of preferred assets"),
  }),
  execute: async ({ riskTolerance = 5, timeHorizon = "Medium", minAPY = 0, preferredAssets = [] }) => {
    try {
      console.log("Fetching yield opportunities with params:", { riskTolerance, timeHorizon, minAPY, preferredAssets });

      // Fetch all pools data from Joule Finance
      const response = await fetch("https://price-api.joule.finance/api/market");

      if (!response.ok) {
        throw new Error(`Failed to fetch pools: ${response.statusText}`);
      }

      const poolsData = await response.json();

      if (!poolsData?.data || !Array.isArray(poolsData.data)) {
        throw new Error("Invalid data structure received from API");
      }

      const pools: PoolAsset[] = poolsData.data;
      console.log(`Retrieved ${pools.length} pools from Joule API`);

      // Apply filters and score opportunities based on risk profile
      const scoredOpportunities = pools
        .filter(pool => {
          // Filter out pools with missing critical data
          return pool &&
                 pool.asset &&
                 pool.asset.type &&
                 typeof pool.depositApy !== 'undefined' &&
                 (typeof pool.marketSize !== 'undefined' && typeof pool.totalBorrowed !== 'undefined');
        })
        .map(pool => {
          // Use default values for missing data or convert from the actual data format
          // Calculate utilization rate from marketSize and totalBorrowed
          const marketSize = pool.marketSize ? parseFloat(pool.marketSize) : 0;
          const totalBorrowed = pool.totalBorrowed ? parseFloat(pool.totalBorrowed) : 0;

          // Calculate utilization as totalBorrowed/marketSize
          const utilization = marketSize > 0 ? totalBorrowed / marketSize : 0;

          // Convert ltv from string to number (div by 100 as it's in basis points)
          const ltv = pool.ltv ? parseFloat(pool.ltv) / 100 : (pool.asset.ltv ? pool.asset.ltv / 100 : 0.7);

          // Use depositApy directly
          const depositAPY = pool.depositApy ?? 0;

          // Get additional APY if available
          const extraDepositAPY = pool.extraAPY?.depositAPY ? parseFloat(pool.extraAPY.depositAPY) : 0;

          // Total APY combining base and extra
          const totalDepositAPY = depositAPY + extraDepositAPY;

          // Calculate a risk score for each pool (lower is less risky)
          // Factors: utilization rate, liquidation threshold, volatility
          const utilizationRisk = utilization * 0.7;  // Higher utilization = higher risk
          const ltvRisk = (1 - ltv / 100) * 0.3;  // Lower LTV = lower risk

          // Combine factors into an overall risk score (1-10 scale)
          const riskScore = Math.round((utilizationRisk + ltvRisk) * 10);

          // Calculate suitability score based on user's risk tolerance
          const riskSuitability = 10 - Math.abs(riskTolerance - riskScore);

          // Apply time horizon factor
          let timeHorizonFactor = 1;
          if (timeHorizon === "Short" && utilization > 0.8) {
            timeHorizonFactor = 0.7;  // Penalize high utilization for short-term
          } else if (timeHorizon === "Long" && totalDepositAPY < 3) {
            timeHorizonFactor = 0.8;  // Penalize low APY for long-term
          }

          // Check if asset is in preferred list
          // Use displayName or assetName depending on what's available
          const assetName = pool.asset.displayName || pool.asset.assetName || '';
          const type = pool.asset.type || '';

          const isPreferred = preferredAssets.length === 0 ||
            preferredAssets.some(asset => {
              const assetLower = asset.toLowerCase();
              return assetName.toLowerCase().includes(assetLower) ||
                     type.toLowerCase().includes(assetLower);
            });

          const preferredFactor = isPreferred ? 1.2 : 1;

          // Calculate final score
          const finalScore = riskSuitability * timeHorizonFactor * preferredFactor;

          return {
            pool,
            riskScore,
            finalScore,
            derived: {
              utilization,
              ltv,
              totalDepositAPY,
              marketSize,
              totalBorrowed,
              isPreferred
            }
          };
        });

      // Filter out opportunities below minimum APY
      const filteredOpportunities = scoredOpportunities
        .filter(opp => opp.derived.totalDepositAPY >= minAPY);

      // Sort by final score (best matches first)
      const sortedOpportunities = filteredOpportunities
        .sort((a, b) => b.finalScore - a.finalScore || b.derived.totalDepositAPY - a.derived.totalDepositAPY);

      // Return the top opportunities with relevant data
      return {
        status: "success",
        opportunities: sortedOpportunities.slice(0, 5).map(opp => ({
          asset: {
            name: opp.pool.asset.displayName || opp.pool.asset.assetName || 'Unknown',
            symbol: opp.pool.asset.assetName || 'UNKNOWN',
            type: opp.pool.asset.type,
            logoUrl: opp.pool.asset.icon || '',
          },
          depositAPY: opp.derived.totalDepositAPY,
          utilizationRate: opp.derived.utilization,
          riskLevel: opp.riskScore <= 3 ? "Low" : opp.riskScore <= 7 ? "Medium" : "High",
          recommendationScore: opp.finalScore,
          liquidity: opp.derived.marketSize - opp.derived.totalBorrowed,
          ltv: opp.derived.ltv
        })),
        riskProfileApplied: {
          riskTolerance,
          timeHorizon,
          minAPY,
          preferredAssets
        }
      };
    } catch (error: Error | unknown) {
      console.error("Error in jouleYieldOpportunities:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: error instanceof Error && 'code' in error ? (error as {code?: string}).code : 'UNKNOWN_ERROR',
      };
    }
  },
});
