"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CirclePlus, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmptyState() {
  const router = useRouter();

  const handleSetupWallet = async () => {
    try {
      // Redirect to home page which will trigger onboarding
      router.push("/");
    } catch (error) {
      console.error("Error setting up AI wallet:", error);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-10">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <WalletCards className="size-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold mb-3">Set up your AI Wallet</h2>
        <p className="text-gray-400 mb-6">
          Create an AI wallet to access the AptoMizer dashboard. Your AI wallet will be used to interact with the Aptos blockchain on your behalf.
        </p>
        <Button onClick={handleSetupWallet} className="gap-2 bg-white text-black hover:bg-gray-100">
          <CirclePlus className="size-4" />
          Set up AI Wallet
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
