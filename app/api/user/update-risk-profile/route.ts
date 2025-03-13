import { NextRequest, NextResponse } from "next/server";
import { getUserByWalletAddress, saveRiskProfile } from "@/lib/wallet-service";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, riskProfile: riskProfileData } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!riskProfileData) {
      return NextResponse.json(
        { error: "Risk profile data is required" },
        { status: 400 }
      );
    }

    // Get the user to ensure they exist and to get their ID
    const user = await getUserByWalletAddress(walletAddress);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Save the risk profile using the user's ID
    await saveRiskProfile(user.id, riskProfileData);

    // Get the updated user data to return to the client
    const updatedUser = await getUserByWalletAddress(walletAddress);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating risk profile:", error);
    return NextResponse.json(
      { error: "Failed to update risk profile" },
      { status: 500 }
    );
  }
}
