"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, User, CheckCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { RiskProfileModal } from "@/components/risk-profile-modal";

interface Transaction {
  id: string;
  txHash: string | null;
  type: string;
  status: string;
  amount: number;
  tokenSymbol: string;
  timestamp: string;
}

interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  aiWallet: {
    id: string;
    walletAddress: string;
    publicKey: string;
    status: string;
    balance: number;
    lastActivity: string | null;
    createdAt: string;
    updatedAt: string;
    transactions: Transaction[];
  } | null;
  riskProfile: {
    id: string;
    riskTolerance: number;
    investmentGoals: string[];
    timeHorizon: string;
    experienceLevel: string;
    preferredAssets: string[];
    volatilityTolerance: number;
    incomeRequirement: boolean;
    rebalancingFrequency: string;
    maxDrawdown: number | null;
    targetAPY: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { account, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRiskProfileModalOpen, setIsRiskProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: false,
    transactionAlerts: true,
    marketUpdates: false,
    securityAlerts: true,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!connected || !account?.address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch user profile data
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: account.address.toString() }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserProfile(data.user);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [connected, account]);

  const handleSaveNotificationSettings = () => {
    alert("Coming soon");
  };

  const handleUpdateProfile = async () => {
    if (!connected || !account?.address) return;

    const displayName = (document.getElementById('displayName') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const bio = (document.getElementById('bio') as HTMLTextAreaElement)?.value;

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address.toString(),
          displayName,
          email,
          bio
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUserProfile(prev => prev ? { ...prev, ...data.user } : null);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleUpdateRiskProfile = async (riskProfileData: any) => {
    if (!connected || !account?.address) return;

    try {
      const response = await fetch('/api/user/update-risk-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address.toString(),
          riskProfile: riskProfileData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update risk profile');
      }

      const data = await response.json();
      setUserProfile(prev => prev ? { ...prev, ...data.user } : null);
      toast.success("Risk profile updated successfully");
      setIsRiskProfileModalOpen(false);
    } catch (error) {
      console.error("Error updating risk profile:", error);
      toast.error("Failed to update risk profile");
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Connect your wallet to view and manage your profile
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" disabled>
              Wallet Not Connected
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-4xl py-10 space-y-8 pt-24 mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-6">
            <User className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              {account?.address && truncateAddress(account.address.toString())}
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="ai-wallet">AI Wallet</TabsTrigger>
            <TabsTrigger value="risk-profile">Risk Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View and update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    value={account?.address?.toString() || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                {userProfile?.aiWallet && (
                  <div className="space-y-2">
                    <Label htmlFor="aiWalletAddress">AI Wallet Address</Label>
                    <Input
                      id="aiWalletAddress"
                      value={userProfile.aiWallet.walletAddress}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    placeholder="Enter a display name"
                    defaultValue={userProfile?.displayName || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    defaultValue={userProfile?.email || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <textarea
                    id="bio"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    placeholder="Tell us a bit about yourself"
                    defaultValue={userProfile?.bio || ""}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="ai-wallet" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Wallet</CardTitle>
                <CardDescription>
                  Manage your AI-powered wallet for automated DeFi operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userProfile?.aiWallet ? (
                  <>
                    <div className="flex items-center justify-center w-full">
                      <div className="bg-gradient-to-br from-primary/30 to-primary/10 rounded-full p-8 mb-4">
                        <CheckCircle className="h-16 w-16 text-primary" />
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-medium mb-2">AI Wallet Active</h3>
                      <p className="text-muted-foreground">
                        Your AI wallet is configured and ready to execute transactions based on your risk profile
                      </p>
                    </div>

                    <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                      <div className="space-y-2">
                        <Label htmlFor="aiWalletAddress" className="text-sm font-medium">AI Wallet Address</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="aiWalletAddress"
                            value={userProfile?.aiWallet?.walletAddress || ""}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (userProfile?.aiWallet?.walletAddress) {
                                navigator.clipboard.writeText(userProfile.aiWallet.walletAddress);
                                toast.success("Address copied to clipboard");
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c0-1.1.9-2 2-2h2"/><path d="M4 12c0-1.1.9-2 2-2h2"/><path d="M4 8c0-1.1.9-2 2-2h2"/></svg>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Creation Date</Label>
                        <p className="text-sm">
                          {userProfile?.aiWallet?.createdAt && new Date(userProfile.aiWallet.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                          <p className="text-sm">Active</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Button variant="outline" className="w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12H7"/><path d="m9 8-4 4 4 4"/></svg>
                        View Transactions
                      </Button>
                      <Button variant="outline" className="w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20V4"/><path d="M5 11l7-7 7 7"/></svg>
                        Fund Wallet
                      </Button>
                    </div>

                    {userProfile?.aiWallet?.transactions && userProfile.aiWallet.transactions.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
                        <div className="space-y-3">
                          {userProfile.aiWallet.transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${tx.type === 'swap' ? 'bg-blue-500/10' : tx.type === 'stake' ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
                                  {tx.type === 'swap' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m17 4 3 3-3 3"/><path d="M20 7H4"/><path d="m7 20-3-3 3-3"/><path d="M4 17h16"/></svg>
                                  ) : tx.type === 'stake' ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <ArrowDownLeft className="h-4 w-4 text-purple-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium capitalize">{tx.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.timestamp).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{tx.amount} {tx.tokenSymbol}</p>
                                <p className={`text-xs ${tx.status === 'completed' ? 'text-green-500' : tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-3 text-sm">
                          View All Transactions
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-full">
                      <div className="bg-muted rounded-full p-8 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-7h-2c0-1-1.5-1.5-1.5-1.5"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-medium mb-2">No AI Wallet Found</h3>
                      <p className="text-muted-foreground">
                        You haven't set up an AI wallet yet. Create one to enable automated DeFi operations.
                      </p>
                    </div>

                    <Button className="w-full" onClick={() => window.location.href = "/"}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      Create AI Wallet
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk-profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Profile</CardTitle>
                <CardDescription>
                  Your investment preferences and risk tolerance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userProfile?.riskProfile ? (
                  <>
                    <div className="flex items-center justify-center w-full">
                      <div className="bg-gradient-to-br from-primary/30 to-primary/10 rounded-full p-8 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-medium mb-2">Risk Profile Active</h3>
                      <p className="text-muted-foreground">
                        Your risk profile is configured and being used to guide your AI wallet's investment decisions
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Risk Tolerance</Label>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${(userProfile.riskProfile.riskTolerance / 10) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Conservative</span>
                            <span>Moderate</span>
                            <span>Aggressive</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Volatility Tolerance</Label>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${(userProfile.riskProfile.volatilityTolerance / 10) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Low</span>
                            <span>Medium</span>
                            <span>High</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Time Horizon</Label>
                          <p className="text-sm">
                            {userProfile.riskProfile.timeHorizon === 'short' && 'Short Term (< 1 year)'}
                            {userProfile.riskProfile.timeHorizon === 'medium' && 'Medium Term (1-3 years)'}
                            {userProfile.riskProfile.timeHorizon === 'long' && 'Long Term (3-10 years)'}
                            {userProfile.riskProfile.timeHorizon === 'very-long' && 'Very Long Term (10+ years)'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Experience Level</Label>
                          <p className="text-sm capitalize">{userProfile.riskProfile.experienceLevel}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Investment Goals</Label>
                          <div className="flex flex-wrap gap-2">
                            {userProfile.riskProfile.investmentGoals.map((goal) => (
                              <span key={goal} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Preferred Assets</Label>
                          <div className="flex flex-wrap gap-2">
                            {userProfile.riskProfile.preferredAssets.map((asset) => (
                              <span key={asset} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary-foreground">
                                {asset}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Income Requirement</Label>
                          <p className="text-sm">{userProfile.riskProfile.incomeRequirement ? 'Yes' : 'No'}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Rebalancing Frequency</Label>
                          <p className="text-sm capitalize">{userProfile.riskProfile.rebalancingFrequency}</p>
                        </div>

                        {userProfile.riskProfile.targetAPY !== null && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Target APY</Label>
                            <p className="text-sm">{userProfile.riskProfile.targetAPY}%</p>
                          </div>
                        )}

                        {userProfile.riskProfile.maxDrawdown !== null && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Maximum Drawdown</Label>
                            <p className="text-sm">{userProfile.riskProfile.maxDrawdown}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(userProfile.riskProfile.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-full">
                      <div className="bg-muted rounded-full p-8 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-medium mb-2">No Risk Profile Found</h3>
                      <p className="text-muted-foreground">
                        You haven't set up a risk profile yet. Create one to enable AI-powered portfolio management.
                      </p>
                    </div>

                    <Button className="w-full" onClick={() => setIsRiskProfileModalOpen(true)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      Create Risk Profile
                    </Button>
                  </>
                )}
              </CardContent>
              <CardFooter>
                {userProfile?.riskProfile && (
                  <Button variant="outline" onClick={() => setIsRiskProfileModalOpen(true)}>
                    Update Risk Profile
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Wallet Permissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Control what operations your AI wallet can perform
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => alert("Coming soon")}>Manage Permissions</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Transaction Limits</Label>
                    <p className="text-sm text-muted-foreground">
                      Set maximum transaction amounts for your AI wallet
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => alert("Coming soon")}>Set Limits</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates and alerts via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({...notifications, emailNotifications: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="transaction-alerts">Transaction Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when transactions are executed
                    </p>
                  </div>
                  <Switch
                    id="transaction-alerts"
                    checked={notifications.transactionAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({...notifications, transactionAlerts: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="market-updates">Market Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about market conditions
                    </p>
                  </div>
                  <Switch
                    id="market-updates"
                    checked={notifications.marketUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications({...notifications, marketUpdates: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about security-related events
                    </p>
                  </div>
                  <Switch
                    id="security-alerts"
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({...notifications, securityAlerts: checked})
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotificationSettings}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RiskProfileModal
        isOpen={isRiskProfileModalOpen}
        onClose={() => setIsRiskProfileModalOpen(false)}
        onComplete={handleUpdateRiskProfile}
      />
    </>
  );
}
