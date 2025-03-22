import { getAptosAgent } from "@/lib/wallet-service";
import { tool } from "ai";
import { z } from "zod";

export const jouleClaimReward = tool({
  description: `this tool can be used to claim rewards from Joule pools

    Supports claiming both APT incentives and amAPT incentives.

    User can only claim rewards for coin -
    usdt - 0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b
    usdc - 0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b
    weth - 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa
    stapt - 0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    rewardCoinType: z.string().describe("The coin type of the reward to claim. eg '0x1::aptos_coin::AptosCoin'"),
  }),
  execute: async ({ userId, rewardCoinType }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
			const claimRewardsTransactionHash = await aptosAgent.claimReward(rewardCoinType)

			const tokenDetails = await aptosAgent.getTokenDetails(rewardCoinType)

      return {
        status: "success",
        claimRewardsTransactionHash,
				reward: {
					coinType: rewardCoinType,
					name: tokenDetails.name,
					type: tokenDetails.type,
					decimals: tokenDetails.decimals,
				},
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
