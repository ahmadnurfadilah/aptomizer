
import { getAptosAgent } from "@/lib/wallet-service";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { tool } from "ai";
import { z } from "zod";

export const transferNFT = tool({
  description: `This tool can be used to transfer any NFT on aptos to receipient`,
  parameters: z.object({
    userId: z.string().describe("The user ID"),
    mint: z.string().describe("The mint of the NFT to transfer. eg 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT"),
    to: z.string().describe("The address to transfer the NFT to"),
  }),
  execute: async ({ userId, mint, to }) => {
    try {
      const aptosAgent = await getAptosAgent(userId);
      const transfer = await aptosAgent.transferNFT(AccountAddress.from(to), AccountAddress.from(mint))

      return {
        status: "success",
        transfer,
        nft: mint,
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
