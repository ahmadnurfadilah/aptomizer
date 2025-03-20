import { getAptosAgent } from "@/lib/wallet-service";
import { AccountAddress, convertAmountFromHumanReadableToOnChain } from "@aptos-labs/ts-sdk";
import { tool } from "ai";
import { z } from "zod";

export const amnisStake = tool({
  description: `this tool can be used to stake APT (Aptos) to amnis validator and receive its liquid staking token stAPT (staked APT)

	keep recipient blank if user themselves wants to receive stAPT and not send to anybody else`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    amount: z.number().describe("The amount to stake"),
    recipient: z.string().optional().describe("The recipient address"),
  }),
  execute: async ({ userId, amount, recipient }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const recipientAddress = recipient ? AccountAddress.from(recipient) : aptosAgent.account.getAddress();

			const stakeTransactionHash = await aptosAgent.stakeTokensWithAmnis(
					recipientAddress,
					convertAmountFromHumanReadableToOnChain(amount, 8)
			);

      return {
        status: "success",
        stakeTransactionHash,
        token: {
          name: "stAPT",
          decimals: 8,
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
