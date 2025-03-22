import { getAptosAgent } from "@/lib/wallet-service";
import { tool } from "ai";
import { z } from "zod";

export const jouleGetUserPosition = tool({
  description: `the tool can be used to get details about a user's position

	ask user to provide positionId from the list of positions they have if they want to get details about a specific position.
	do not fill random positionId if the user didn't provide any positionId`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    positionId: z.string().describe("The position ID of the position to get details about. eg '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa'"),
  }),
  execute: async ({ userId, positionId }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
			const userAddress = aptosAgent.account.getAddress()

			const jouleUserPosition = await aptosAgent.getUserPosition(userAddress, positionId)

      return {
        status: "success",
        jouleUserPosition,
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
