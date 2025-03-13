import { tool } from "ai";
import { z } from "zod";
import { getAptosAgent } from "../wallet-service";

export const getBalance = tool({
  description: "Get the balance of a Aptos account",
  parameters: z.object({
    userId: z.string().describe("The user ID"),
  }),
  execute: async ({ userId }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const balance = await aptosAgent.getBalance();
      return {
        status: "success",
        balance,
        token: {
          name: "APT",
          decimals: 8,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      };
    }
  },
});
