import { tool } from "ai";
import { z } from "zod";

export const jouleGetPoolDetails = tool({
  description: `the tool can be used to get a token / fungible asset pool details`,
  parameters: z.object({
    mint: z.string().describe("The mint of the token to get details. eg '0x1::aptos_coin::AptosCoin'"),
  }),
  execute: async ({ mint }) => {
    try {
      console.log("mint", mint);
      const response = await fetch(`https://price-api.joule.finance/api/market`);

      if (!response.ok) {
        throw new Error(`Failed to fetch pool details: ${response.statusText}`);
      }

      interface PoolAsset {
        asset: {
          type: string;
        };
      }

      const pool: { data: PoolAsset[] } = await response.json();

      const poolDetail = pool.data.find((pool) => pool.asset.type.includes(mint));

      if (!poolDetail) {
        throw new Error("Pool not found");
      }

      return {
        status: "success",
        pool: poolDetail,
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
