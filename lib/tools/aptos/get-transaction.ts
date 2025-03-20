import { tool } from "ai";
import { z } from "zod";
import { getAptosAgent } from "../../wallet-service";

export const getTransaction = tool({
  description: "Fetches a transaction from aptos blockchain",
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    transactionHash: z.string().describe("The transaction hash"),
  }),
  execute: async ({ userId, transactionHash }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const transaction = await aptosAgent.getTransaction(transactionHash);
      console.log('transaction', transaction);
      return {
        status: "success",
        transaction,
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
