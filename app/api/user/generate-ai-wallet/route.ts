import { NextRequest, NextResponse } from "next/server";
import { generateAiWallet } from "@/lib/wallet-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const aiWallet = await generateAiWallet(userId);

    return NextResponse.json({ aiWallet });
  } catch (error) {
    console.error("Error generating AI wallet:", error);
    return NextResponse.json(
      { error: "Failed to generate AI wallet" },
      { status: 500 }
    );
  }
}
