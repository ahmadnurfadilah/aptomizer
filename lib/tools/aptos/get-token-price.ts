import { tool } from "ai";
import { z } from "zod";
import { getAptosAgent } from "../../wallet-service";

export const getTokenPrice = tool({
  description: `Get the live price of any aptos tokens in USD.
	do not do any decimals conversion here, the price is already in USD

    details also include decimals which you can use to make onchain values readable to a human user`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    token: z.string().describe("eg usdt, btc"),
  }),
  execute: async ({ userId, token }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const tokenData = await aptosAgent.getTokenPrice(token);
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
