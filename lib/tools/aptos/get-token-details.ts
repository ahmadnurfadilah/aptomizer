import { getAptosAgent } from "@/lib/wallet-service";
import { tool } from "ai";
import { z } from "zod";

export const getTokenDetails = tool({
  description: `Get the details of any aptos tokens.
    details also include decimals which you can use to make onchain values readable to a human user`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    mint: z.string().describe(`eg "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT"`),
  }),
  execute: async ({ userId, mint }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const tokenData = await aptosAgent.getTokenDetails(mint);
      return {
        status: "success",
        tokenData,
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
