import { tokensList } from "@/lib/get-pool-address-by-token-name";
import { getAptosAgent } from "@/lib/wallet-service";
import { tool } from "ai";
import { z } from "zod";

export const jouleGetUserAllPositions = tool({
  description: `the tool can be used to get details about a user's all positions`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
  }),
  execute: async ({ userId }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
			const userAddress = aptosAgent.account.getAddress()

			const jouleUserAllPositions = await aptosAgent.getUserAllPositions(userAddress)

      return {
        status: "success",
        jouleUserAllPositions,
				tokens: tokensList.map((token) => {
					return {
						name: token.name,
						decimals: token.decimals,
						tokenAddress: token.tokenAddress,
					}
				}),
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
