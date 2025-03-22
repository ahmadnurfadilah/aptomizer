import { getAptosAgent } from "@/lib/wallet-service";
import { convertAmountFromHumanReadableToOnChain } from "@aptos-labs/ts-sdk";
import { tool } from "ai";
import { z } from "zod";

export const jouleLendToken = tool({
  description: `this tool can be used to lend APT, tokens or fungible asset to a position

  if you want to lend APT, mint will be "0x1::aptos_coin::AptosCoin"
  if you want to lend token other than APT, you need to provide the mint of that specific token
  if you want to lend fungible asset, add "0x1::aptos_coin::AptosCoin" as mint and provide fungible asset address

  if positionId is not provided, the positionId will be 1234 and newPosition should be true`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    amount: z.number().describe("The amount to lend"),
    mint: z.string().describe("The mint of the token to lend. eg '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT'"),
    positionId: z.string().describe("The position ID of the position to lend to. eg '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa'"),
    newPosition: z.boolean().describe("Whether to create a new position or not. eg true"),
  }),
  execute: async ({ userId, amount, mint, positionId, newPosition }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
			const mintDetail = await aptosAgent.getTokenDetails(mint)

			const fungibleAsset = mintDetail.faAddress.toLowerCase() === mint.toLowerCase()

			const lendTokenTransactionHash = await aptosAgent.lendToken(
				convertAmountFromHumanReadableToOnChain(amount, mintDetail.decimals || 8),
				mint as `${string}::${string}::${string}`,
				positionId,
				newPosition,
				fungibleAsset
			)

      return {
        status: "success",
        lendTokenTransactionHash,
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
