"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { RiskProfileModal } from "./risk-profile-modal";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle, Copy, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

export function OnboardingFlow() {
  const { account, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAiWallet, setHasAiWallet] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [aiWalletAddress, setAiWalletAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isPrivateKeyCopied, setIsPrivateKeyCopied] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const checkWalletStatus = async () => {
      if (connected && account?.address) {
        setIsLoading(true);
        try {
          // Check if user has AI wallet
          const response = await fetch('/api/user/has-ai-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: account.address.toString() }),
          });

          if (!response.ok) {
            throw new Error('Failed to check wallet status');
          }

          const data = await response.json();
          setHasAiWallet(data.hasAiWallet);

          if (!data.hasAiWallet) {
            // Create user if they don't exist yet
            const createResponse = await fetch('/api/user/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ walletAddress: account.address.toString() }),
            });

            if (createResponse.ok) {
              const userData = await createResponse.json();
              setUserId(userData.user.id);
            }
          }
        } catch (error) {
          console.error("Error checking wallet status:", error);
          toast.error("Failed to check wallet status");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setHasAiWallet(false);
      }
    };

    checkWalletStatus();
  }, [connected, account]);

  const handleStartRiskAssessment = () => {
    setShowRiskModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRiskProfileComplete = async (riskProfileData: any) => {
    setShowRiskModal(false);
    setIsLoading(true);

    try {
      if (!account?.address) {
        throw new Error("Wallet not connected");
      }

      // Create user if not already done
      if (!userId) {
        const createResponse = await fetch('/api/user/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: account.address.toString() }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create user');
        }

        const userData = await createResponse.json();
        setUserId(userData.user.id);
      }

      // Save risk profile
      const saveProfileResponse = await fetch('/api/user/save-risk-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          riskProfileData
        }),
      });

      if (!saveProfileResponse.ok) {
        throw new Error('Failed to save risk profile');
      }

      // Generate AI wallet
      const generateWalletResponse = await fetch('/api/user/generate-ai-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!generateWalletResponse.ok) {
        throw new Error('Failed to generate AI wallet');
      }

      const walletData = await generateWalletResponse.json();
      setAiWalletAddress(walletData.aiWallet.walletAddress);
      setPrivateKey(walletData.aiWallet.privateKey);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error creating AI wallet:", error);
      toast.error("Failed to create AI wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey);
    setIsPrivateKeyCopied(true);
    toast.success("Private key copied to clipboard");
    setTimeout(() => setIsPrivateKeyCopied(false), 3000);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setPrivateKey("");
    setHasAiWallet(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking wallet status...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your Aptos wallet to get started with AptoMizer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-center mb-4">
            Please connect your wallet using the button in the navigation bar to continue.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasAiWallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>AI Wallet Ready</CardTitle>
          <CardDescription>
            Your AI wallet is set up and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-center mb-4">
            Your AI wallet is configured based on your risk profile. You can now use AptoMizer to manage your DeFi portfolio.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Set Up Your AI Wallet</CardTitle>
          <CardDescription>
            Create an AI-powered wallet to automate your DeFi operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-center mb-6">
            To get started, we need to understand your investment preferences and risk tolerance. This will help us configure your AI wallet appropriately.
          </p>
          <div className="w-full space-y-4">
            <Button className="w-full" onClick={handleStartRiskAssessment}>
              Start Risk Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Profile Modal */}
      <RiskProfileModal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        onComplete={handleRiskProfileComplete}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={closeSuccessModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Wallet Created Successfully</DialogTitle>
            <DialogDescription>
              Your AI wallet has been created. Please save your private key in a secure location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">AI Wallet Address:</p>
              <div className="p-2 bg-muted rounded-md text-xs break-all font-mono">
                {aiWalletAddress}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Private Key:</p>
              <div className="relative">
                <div className="p-2 bg-muted rounded-md text-xs break-all font-mono">
                  {privateKey}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1"
                  onClick={copyPrivateKey}
                >
                  {isPrivateKeyCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Never share your private key with anyone. Store it securely.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeSuccessModal}>
              I&apos;ve Saved My Private Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
