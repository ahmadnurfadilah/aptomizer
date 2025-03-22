import { getAptosAgent } from "@/lib/wallet-service";
import { tool } from "ai";
import { z } from "zod";

export const jouleGetPoolDetails = tool({
  description: `the tool can be used to get a token / fungible asset pool details`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    mint: z.string().describe("The mint of the token to get details. eg '0x1::aptos_coin::AptosCoin'"),
  }),
  execute: async ({ userId, mint }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
			const pool = await aptosAgent.getPoolDetails(mint)

      return {
        status: "success",
        pool,
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
