import { getAptosAgent } from "@/lib/wallet-service";
import { convertAmountFromHumanReadableToOnChain } from "@aptos-labs/ts-sdk";
import { tool } from "ai";
import { z } from "zod";

export const jouleWithdrawToken = tool({
  description: `this tool can be used to withdraw APT, tokens or fungible asset from a position

  if you want to withdraw APT, add "0x1::aptos_coin::AptosCoin" as mint
  if you want to withdraw token other than APT, you need to provide the mint of that specific token
  if you want to withdraw fungible asset, add "0x1::aptos_coin::AptosCoin" as mint and provide fungible asset address`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    amount: z.number().describe("The amount to withdraw"),
    mint: z.string().describe("The mint of the token to withdraw. eg '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT'"),
    positionId: z.string().describe("The position ID of the position to withdraw from. eg '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa'"),
  }),
  execute: async ({ userId, amount, mint, positionId }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
			const mintDetail = await aptosAgent.getTokenDetails(mint)

			const fungibleAsset = mintDetail.faAddress.toLowerCase() === mint.toLowerCase()

			const withdrawTokenTransactionHash = await aptosAgent.withdrawToken(
				convertAmountFromHumanReadableToOnChain(amount, mintDetail.decimals || 8),
				mint as `${string}::${string}::${string}`,
				positionId,
				fungibleAsset
			)

      return {
        status: "success",
        withdrawTokenTransactionHash,
        token: {
					name: mintDetail.name,
					decimals: mintDetail.decimals,
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
