import { getAptosAgent } from "@/lib/wallet-service";
import { tool } from "ai";
import { z } from "zod";

export const panoraSwap = tool({
  description: `this tool can be used to swap tokens in panora - liquidity aggregator on aptos
    if you want to swap APT and one of the token, fromToken will be "0x1::aptos_coin::AptosCoin`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    fromToken: z.string().describe("The token to swap from"),
    toToken: z.string().describe("The token to swap to"),
    amount: z.number().describe("The amount to swap"),
    toWalletAddress: z.string().optional().describe("The wallet address to receive the swapped tokens"),
  }),
  execute: async ({ userId, fromToken, toToken, amount, toWalletAddress }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const mintXDetail = await aptosAgent.getTokenDetails(fromToken);
      const mintYDetail = await aptosAgent.getTokenDetails(toToken);

      const swapTransactionHash = await aptosAgent.swapWithPanora(
        fromToken,
        toToken,
        amount,
        toWalletAddress
    	);

      return {
        status: "success",
        swapTransactionHash,
        token: [
            {
                mintX: mintXDetail.name,
                decimals: mintXDetail.decimals,
            },
            {
                mintY: mintYDetail.name,
                decimals: mintYDetail.decimals,
            },
        ],
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
