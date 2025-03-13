import { NextRequest, NextResponse } from "next/server";
import { saveRiskProfile } from "@/lib/wallet-service";

export async function POST(request: NextRequest) {
  try {
    const { userId, riskProfileData } = await request.json();

    if (!userId || !riskProfileData) {
      return NextResponse.json(
        { error: "User ID and risk profile data are required" },
        { status: 400 }
      );
    }

    const riskProfile = await saveRiskProfile(userId, riskProfileData);

    return NextResponse.json({ riskProfile });
  } catch (error) {
    console.error("Error saving risk profile:", error);
    return NextResponse.json(
      { error: "Failed to save risk profile" },
      { status: 500 }
    );
  }
}
