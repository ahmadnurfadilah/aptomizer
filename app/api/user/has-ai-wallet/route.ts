import { NextRequest, NextResponse } from "next/server";
import { checkUserHasAiWallet } from "@/lib/wallet-service";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const hasAiWallet = await checkUserHasAiWallet(walletAddress);

    return NextResponse.json({ hasAiWallet });
  } catch (error) {
    console.error("Error checking AI wallet status:", error);
    return NextResponse.json(
      { error: "Failed to check AI wallet status" },
      { status: 500 }
    );
  }
}
