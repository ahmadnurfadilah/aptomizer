import { getAptosAgent } from "@/lib/wallet-service";
import { AccountAddress, convertAmountFromHumanReadableToOnChain } from "@aptos-labs/ts-sdk";
import { tool } from "ai";
import { z } from "zod";

export const transferToken = tool({
  description: `This tool can be used to transfer APT, any token or fungible asset to a recipien
    if you want to transfer APT, mint will be "0x1::aptos_coin::AptosCoin"
    if you want to transfer token other than APT, you need to provide the mint of that specific token
    if you want to transfer fungible asset, add fungible asset address as mint

    keep to blank if user themselves wants to receive the token and not send to anybody else`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    mint: z.string().describe("If you want to transfer token other than APT, you need to provide the mint of that specific token like 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT"),
    amount: z.number().describe("The amount to transfer"),
    to: z.string().optional().describe("The address to transfer the token to"),
  }),
  execute: async ({ userId, mint, amount, to }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);

      const mintDetail = await aptosAgent.getTokenDetails(mint);

      const recipient = to ? AccountAddress.from(to) : aptosAgent.account.getAddress();

      const transferTokenTransactionHash = await aptosAgent.transferTokens(
        recipient,
        convertAmountFromHumanReadableToOnChain(
          amount,
          mintDetail.decimals || 6
        ),
        mint
      );

      return {
        status: "success",
        transferTokenTransactionHash,
        token: {
          name: mintDetail.name,
          decimals: mintDetail.decimals,
        },
      };
    } catch (error: Error | unknown) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        code: error instanceof Error && "code" in error ? (error as { code?: string }).code : "UNKNOWN_ERROR",
      };
    }
  },
});
