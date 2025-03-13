import { NextRequest, NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/wallet-service";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, displayName, email, bio } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const user = await updateUserProfile(walletAddress, { displayName, email, bio });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
