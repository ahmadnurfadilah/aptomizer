import { tool } from "ai";
import { z } from "zod";

export const jouleGetAllPools = tool({
  description: `the tool can be used to get all the pools`,
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch("https://price-api.joule.finance/api/market");
      const pools = await response.json();

      return {
        status: "success",
        pools: pools.data,
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
