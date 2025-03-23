"use client";

import ThreeDotsLoading from "@/components/icon/three-dots-loading";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatSuggestions } from "@/components/ui/chat-suggestions";
import { Spotlight } from "@/components/ui/spotlight";
import { useChat } from "@ai-sdk/react";
import { Bot, LineChart, SendToBack, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { marked } from "marked";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { WalletSelector } from "@/components/wallet-selector";
import { JoulePoolsList } from "@/components/joule/pools-list";
import { JoulePoolDetails } from "@/components/joule/pool-details";
import { PortfolioVisualization } from "@/components/portfolio/portfolio-visualization";
import { YieldOpportunitiesList, YieldOpportunity } from "@/components/joule/yield-opportunities";
import { JouleUserPosition, UserPosition } from "@/components/joule/user-position";
import { JouleUserPositionsList, PositionSummary } from "@/components/joule/user-positions-list";

// Import the Pool types from the components
import type { Pool } from "@/components/joule/pools-list";
import type { PoolDetail } from "@/components/joule/pool-details";

// Types for message parts and tool invocations
interface MessagePart {
  type: 'text' | 'tool-invocation';
  text?: string;
  toolInvocation?: ToolInvocation;
}

interface ToolInvocation {
  toolName: string;
  state: 'call' | 'result' | 'error';
  args?: Record<string, string | number | boolean>;
  result?: Record<string, unknown>;
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
  toolInvocations?: ToolInvocation[];
}

// Portfolio data interface
interface PortfolioAsset {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  priceUsd: number;
  change24h: number | null;
  apy: number | null;
  logoUrl: string;
}

interface PortfolioStrategy {
  name: string;
  protocol: string;
  balance: number;
  value: number;
  apy: number;
  timeLeft: string | null;
  health: string;
}

interface Portfolio {
  aiWalletAddress: string;
  totalValue: number;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  riskScore: number;
  assets: PortfolioAsset[];
  strategies: PortfolioStrategy[];
}

// Define interfaces for API responses

// Token type for jouleGetUserAllPositions
interface TokenInfo {
  name: string;
  decimals: number;
  tokenAddress: string;
}

// Define interfaces for Joule API responses

// Extended interfaces for the new position format
interface LendPosition {
  key: string; // token address
  value: string; // amount as string
}

interface BorrowPosition {
  key: string; // token address
  value: string; // amount as string
}

interface JoulePositionData {
  key: string; // position ID
  value: {
    lend_positions?: {
      data: LendPosition[];
    };
    borrow_positions?: {
      data: BorrowPosition[];
    };
    position_name?: string;
  };
}

interface JoulePosition {
  positions_map: {
    data: JoulePositionData[];
  };
  user_position_ids: string[];
}

// Original position data format for jouleGetUserPosition
interface PositionData {
  uid: string;
  poolId: string;
  mintAddress?: string;
  owner?: string;
  health?: string;
  borrowed?: string;
  borrowedUsd?: string;
  supplied?: string;
  suppliedUsd?: string;
  collateral?: string;
  collateralUsd?: string;
}

// Position data from jouleGetUserPosition
interface UserPositionData extends PositionData {
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogo?: string;
  liquidationThreshold?: string;
  maxLtv?: string;
  borrowLimit?: string;
  borrowLimitUsed?: string;
}

export default function Home() {
  const { account, connected } = useWallet();
  // const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { messages, status, input, handleInputChange, handleSubmit } = useChat({
    body: {
      userWalletAddress: account?.address?.toString(),
    },
    maxSteps: 5,
  });

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  const chatSuggestions = [
    { text: "What's in my portfolio?", icon: <LineChart size={16} /> },
    { text: "Show me my Joule Finance positions", icon: <Wallet size={16} /> },
    { text: "I want to stake APT", icon: <Wallet size={16} /> },
    { text: "What are the best yield opportunities?", icon: <LineChart size={16} /> },
    { text: "Swap tokens", icon: <Wallet size={16} /> },
    { text: "Explain how liquidity pools work", icon: <Bot size={16} /> },
    { text: "What are the risks of DeFi?", icon: <Bot size={16} /> },
  ];

  const handleSuggestionSelect = (suggestion: string) => {
    handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>);
    // We don't auto-submit to give user a chance to modify the suggestion if needed
  };

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (connected && account?.address) {
        // setIsCheckingOnboarding(true);
        try {
          const response = await fetch('/api/user/has-ai-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: account.address.toString() }),
          });

          if (!response.ok) {
            throw new Error('Failed to check onboarding status');
          }

          const data = await response.json();
          setHasCompletedOnboarding(data.hasAiWallet);
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        } finally {
          // setIsCheckingOnboarding(false);
        }
      } else {
        setHasCompletedOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [connected, account]);

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLDivElement>) => {
    handleSubmit(e);
  };

  // Helper to render message content
  const renderMessageContent = (message: Message) => {
    if (!message.parts || message.parts.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} className="prose prose-p:text-sm prose-invert"></div>;
    }

    return message.parts.map((part: MessagePart, partIndex: number) => {
      if (!message.toolInvocations && part.type === 'text' && part.text) {
        return (
          <div key={`text-${partIndex}`} dangerouslySetInnerHTML={{ __html: marked.parse(part.text) }} className="prose prose-p:text-sm prose-invert"></div>
        );
      } else if (part.type === 'tool-invocation' && part.toolInvocation) {
        const toolInvocation = part.toolInvocation;

        if (toolInvocation.toolName === 'jouleGetAllPools') {
          switch (toolInvocation.state) {
            case 'call':
              return <div key={`tool-${partIndex}`} className="py-0">Fetching all Joule pools...</div>;
            case 'result':
              return (
                <div key={`tool-${partIndex}`} className="py-0 w-full">
                  <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">Here are the pools:</div>
                  <JoulePoolsList pools={(toolInvocation.result?.pools as Pool[]) || []} />
                </div>
              );
            default:
              return null;
          }
        } else if (toolInvocation.toolName === 'jouleGetPoolDetails') {
          switch (toolInvocation.state) {
            case 'call':
              return <div key={`tool-${partIndex}`} className="py-0">Fetching pool details for {toolInvocation.args?.mint || 'this pool'}...</div>;
            case 'result':
              return (
                <div key={`tool-${partIndex}`} className="py-0 w-full">
                  <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">Here is the pool details:</div>
                  <JoulePoolDetails pool={(toolInvocation.result?.pool as PoolDetail)} />
                </div>
              );
            default:
              return null;
          }
        } else if (toolInvocation.toolName === 'jouleYieldOpportunities') {
          switch (toolInvocation.state) {
            case 'call':
              return <div key={`tool-${partIndex}`} className="py-0">Finding the best yield opportunities for you...</div>;
            case 'result':
              if (toolInvocation.result?.status === 'success' && toolInvocation.result?.opportunities) {
                const opportunities = toolInvocation.result.opportunities as YieldOpportunity[];
                const riskProfileApplied = toolInvocation.result.riskProfileApplied as {
                  riskTolerance: number;
                  timeHorizon: string;
                  minAPY: number;
                  preferredAssets: string[];
                };

                const handleYieldActionClick = (message: string) => {
                  // Set the user's input to the message text
                  handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
                  // Create a fake event and call the component's handleOnSubmit function
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                  handleOnSubmit(fakeEvent);
                };

                return (
                  <div key={`tool-${partIndex}`} className="py-0 w-full">
                    <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">Here are the best yield opportunities for your profile:</div>
                    <YieldOpportunitiesList
                      opportunities={opportunities}
                      riskProfileApplied={riskProfileApplied}
                      onActionClick={handleYieldActionClick}
                    />
                  </div>
                );
              } else {
                return (
                  <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                    Unable to find yield opportunities: {(toolInvocation.result?.message as string) || 'Unknown error'}
                  </div>
                );
              }
            default:
              return null;
          }
        } else if (toolInvocation.toolName === 'jouleGetUserAllPositions') {
          switch (toolInvocation.state) {
            case 'call':
              return <div key={`tool-${partIndex}`} className="py-0">Fetching your Joule Finance positions...</div>;
            case 'result':
              if (toolInvocation.result?.status === 'success' && toolInvocation.result?.jouleUserAllPositions) {
                // Get the user positions data from the API response
                const positionsData = toolInvocation.result.jouleUserAllPositions as JoulePosition[];
                const tokens = toolInvocation.result.tokens as TokenInfo[] || [];

                // Process the positions data to create a list of positions
                const positions: PositionSummary[] = [];

                // Parse the new positions format
                for (const positionWrapper of positionsData) {
                  if (!positionWrapper.positions_map?.data) continue;

                  // Loop through each position in the positions_map
                  for (const positionEntry of positionWrapper.positions_map.data) {
                    const positionId = positionEntry.key;
                    const positionDetails = positionEntry.value;

                    // Process lend positions
                    if (positionDetails.lend_positions?.data) {
                      for (const lendPosition of positionDetails.lend_positions.data) {
                        const tokenAddress = lendPosition.key;
                        const amount = lendPosition.value;

                        // Find the token details
                        const token = tokens.find(t => t.tokenAddress === tokenAddress);
                        if (!token) continue;

                        // Calculate values
                        const amountNumber = parseFloat(amount) / Math.pow(10, token.decimals);
                        // We don't have USD values in this response, but we can estimate
                        const estimatedUsdValue = amountNumber * 10; // Placeholder - replace with actual price

                        positions.push({
                          positionId,
                          poolId: tokenAddress,
                          tokenName: token.name,
                          tokenSymbol: token.name,
                          supplied: amountNumber,
                          suppliedUsd: estimatedUsdValue,
                          borrowed: 0,
                          borrowedUsd: 0,
                          collateral: 0,
                          collateralUsd: 0,
                          health: 2.0, // Default healthy
                          healthStatus: 'Healthy'
                        });
                      }
                    }

                    // Process borrow positions
                    if (positionDetails.borrow_positions?.data) {
                      for (const borrowPosition of positionDetails.borrow_positions.data) {
                        const tokenAddress = borrowPosition.key;
                        const amount = borrowPosition.value;

                        // Find the token details
                        const token = tokens.find(t => t.tokenAddress === tokenAddress);
                        if (!token) continue;

                        // Find if we already have a position for this token
                        const existingPosition = positions.find(p =>
                          p.positionId === positionId && p.poolId === tokenAddress
                        );

                        const amountNumber = parseFloat(amount) / Math.pow(10, token.decimals);
                        const estimatedUsdValue = amountNumber * 10; // Placeholder

                        if (existingPosition) {
                          // Update existing position
                          existingPosition.borrowed = amountNumber;
                          existingPosition.borrowedUsd = estimatedUsdValue;
                          // Update health calculation
                          if (existingPosition.suppliedUsd > 0) {
                            const health = existingPosition.suppliedUsd / existingPosition.borrowedUsd;
                            existingPosition.health = health;
                            if (health < 1.1) {
                              existingPosition.healthStatus = 'Danger';
                            } else if (health < 1.25) {
                              existingPosition.healthStatus = 'Warning';
                            }
                          }
                        } else {
                          // Create new position for borrow-only
                          positions.push({
                            positionId,
                            poolId: tokenAddress,
                            tokenName: token.name,
                            tokenSymbol: token.name,
                            supplied: 0,
                            suppliedUsd: 0,
                            borrowed: amountNumber,
                            borrowedUsd: estimatedUsdValue,
                            collateral: 0,
                            collateralUsd: 0,
                            health: 1.5, // Default medium
                            healthStatus: 'Warning'
                          });
                        }
                      }
                    }
                  }
                }

                // Add position name if available
                for (const positionWrapper of positionsData) {
                  if (!positionWrapper.positions_map?.data) continue;

                  for (const positionEntry of positionWrapper.positions_map.data) {
                    const positionId = positionEntry.key;
                    const positionDetails = positionEntry.value;

                    // Find all positions with this ID and add position name
                    if (positionDetails.position_name) {
                      for (const position of positions) {
                        if (position.positionId === positionId) {
                          position.tokenName = `${position.tokenName} (${positionDetails.position_name})`;
                        }
                      }
                    }
                  }
                }

                // Get user's wallet address to include in the query for position details
                const handlePositionSelect = (positionId: string) => {
                  // Create a message asking for details about this specific position
                  const message = `Show me details for my position ${positionId}`;

                  // Set the input and submit
                  handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                  handleOnSubmit(fakeEvent);
                };

                // If no positions were found, show empty state
                if (positions.length === 0) {
                  return (
                    <div key={`tool-${partIndex}`} className="py-0 w-full">
                      <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">You don&apos;t have any active positions on Joule Finance.</div>
                    </div>
                  );
                }

                return (
                  <div key={`tool-${partIndex}`} className="py-0 w-full">
                    <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">Here are your positions on Joule Finance:</div>
                    <JouleUserPositionsList
                      positions={positions}
                      onPositionSelect={handlePositionSelect}
                    />
                  </div>
                );
              } else {
                return (
                  <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                    Unable to fetch your positions: {(toolInvocation.result?.message as string) || 'Unknown error'}
                  </div>
                );
              }
            default:
              return null;
          }
        } else if (toolInvocation.toolName === 'jouleGetUserPosition') {
          switch (toolInvocation.state) {
            case 'call':
              return <div key={`tool-${partIndex}`} className="py-0">Fetching position details...</div>;
            case 'result':
              if (toolInvocation.result?.status === 'success' && toolInvocation.result?.jouleUserPosition) {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const positionData = toolInvocation.result.jouleUserPosition as any;

                  // Check if the response is an array (new format)
                  if (Array.isArray(positionData) && positionData.length > 0) {
                    const positionEntry = positionData[0]; // Take the first position from array

                    // Find the token information
                    const tokens = toolInvocation.result.tokens as TokenInfo[] || [];
                    let tokenName = 'Unknown';
                    let tokenSymbol = 'UNKNOWN';
                    let tokenDecimals = 8;

                    // Calculate supplied and borrowed amounts
                    let supplied = 0;
                    let borrowed = 0;
                    const collateral = 0;

                    // Extract position name
                    const positionName = positionEntry.position_name || '';

                    // Get token data from lend positions
                    let tokenAddress = '';

                    if (positionEntry.lend_positions?.data && positionEntry.lend_positions.data.length > 0) {
                      const lendPosition = positionEntry.lend_positions.data[0];
                      tokenAddress = lendPosition.key;
                      const amount = lendPosition.value;

                      // Find token details - add fallback for common tokens
                      const token = tokens?.find(t => t.tokenAddress === tokenAddress);
                      if (token) {
                        tokenName = token.name;
                        tokenSymbol = token.name;
                        tokenDecimals = token.decimals;
                      } else if (tokenAddress === "0x1::aptos_coin::AptosCoin") {
                        // Fallback for APT token
                        tokenName = "Aptos Coin";
                        tokenSymbol = "APT";
                        tokenDecimals = 8;
                      }

                      // Convert amount to decimal based on token decimals
                      supplied = parseFloat(amount) / Math.pow(10, tokenDecimals);
                    }

                    if (positionEntry.borrow_positions?.data && positionEntry.borrow_positions.data.length > 0) {
                      const borrowPosition = positionEntry.borrow_positions.data[0];
                      const borrowTokenAddress = borrowPosition.key;
                      const amount = borrowPosition.value;

                      // If no lend position was found, use the borrow position for token info
                      if (!tokenAddress) {
                        tokenAddress = borrowTokenAddress;
                        const token = tokens?.find(t => t.tokenAddress === tokenAddress);
                        if (token) {
                          tokenName = token.name;
                          tokenSymbol = token.name;
                          tokenDecimals = token.decimals;
                        } else if (tokenAddress === "0x1::aptos_coin::AptosCoin") {
                          // Fallback for APT token
                          tokenName = "Aptos Coin";
                          tokenSymbol = "APT";
                          tokenDecimals = 8;
                        }
                      }

                      // Calculate borrowed amount
                      borrowed = parseFloat(amount) / Math.pow(10, tokenDecimals);
                    }

                    // Generate a position ID if not available
                    const positionId = tokenAddress || 'position-1';

                    // Calculate USD values (placeholder)
                    const suppliedUsd = supplied * 10; // Placeholder price
                    const borrowedUsd = borrowed * 10; // Placeholder price
                    const collateralUsd = collateral * 10; // Placeholder price

                    // Calculate health and status
                    let health = 2.0; // Default
                    let healthStatus: 'Healthy' | 'Warning' | 'Danger' = 'Healthy';

                    if (borrowed > 0 && supplied > 0) {
                      health = suppliedUsd / borrowedUsd;
                      if (health < 1.1) {
                        healthStatus = 'Danger';
                      } else if (health < 1.25) {
                        healthStatus = 'Warning';
                      }
                    }

                    // Create position object
                    const position: UserPosition = {
                      positionId,
                      owner: 'N/A',
                      poolId: tokenAddress,
                      tokenName: positionName ? `${tokenName} (${positionName})` : tokenName,
                      tokenSymbol,
                      borrowed,
                      borrowedUsd,
                      supplied,
                      suppliedUsd,
                      collateral,
                      collateralUsd,
                      health,
                      liquidationThreshold: 0.85,
                      maxLtv: 0.7,
                      healthStatus,
                      borrowLimit: suppliedUsd * 0.7,
                      borrowLimitUsed: suppliedUsd > 0 ? (borrowedUsd / (suppliedUsd * 0.7)) * 100 : 0
                    };

                    return (
                      <div key={`tool-${partIndex}`} className="py-0 w-full">
                        <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">Here are the details for your position:</div>
                        <JouleUserPosition position={position} />
                      </div>
                    );
                  } else {
                    // Handle older formats or unexpected response
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const positionDataObj = positionData as Record<string, any>;
                    let position: UserPosition | null = null;

                    if (positionDataObj.positions_map && positionDataObj.positions_map.data && positionDataObj.positions_map.data.length > 0) {
                      // This is in the format with positions_map
                      // Process as before...
                      // Code for handling positions_map format

                      // Return error as fallback for now
                      return (
                        <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                          Unable to parse position details. Please update the code to handle positions_map format.
                        </div>
                      );
                    } else if (positionDataObj.uid) {
                      // This is in the original format
                      const pData = positionDataObj as unknown as UserPositionData;

                      // Calculate health status based on health score
                      const health = parseFloat(pData.health || '0');
                      let healthStatus: 'Healthy' | 'Warning' | 'Danger' = 'Healthy';

                      if (health < 1.1) {
                        healthStatus = 'Danger';
                      } else if (health < 1.25) {
                        healthStatus = 'Warning';
                      }

                      // Format the data for our component
                      position = {
                        positionId: pData.uid,
                        owner: pData.owner || '',
                        poolId: pData.poolId,
                        tokenName: pData.tokenName || 'Unknown',
                        tokenSymbol: pData.tokenSymbol || 'UNKNOWN',
                        tokenLogo: pData.tokenLogo,
                        borrowed: parseFloat(pData.borrowed || '0'),
                        borrowedUsd: parseFloat(pData.borrowedUsd || '0'),
                        supplied: parseFloat(pData.supplied || '0'),
                        suppliedUsd: parseFloat(pData.suppliedUsd || '0'),
                        collateral: parseFloat(pData.collateral || '0'),
                        collateralUsd: parseFloat(pData.collateralUsd || '0'),
                        health,
                        liquidationThreshold: parseFloat(pData.liquidationThreshold || '0') / 100,
                        maxLtv: parseFloat(pData.maxLtv || '0') / 100,
                        healthStatus,
                        borrowLimit: parseFloat(pData.borrowLimit || '0'),
                        borrowLimitUsed: parseFloat(pData.borrowLimitUsed || '0')
                      };

                      return (
                        <div key={`tool-${partIndex}`} className="py-0 w-full">
                          <div className="prose prose-p:text-sm prose-invert mb-2 text-sm">Here are the details for your position:</div>
                          <JouleUserPosition position={position} />
                        </div>
                      );
                    } else {
                      return (
                        <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                          Unable to parse position details. Unexpected response format.
                        </div>
                      );
                    }
                  }
                } catch (error) {
                  console.error("Error parsing position data:", error);
                  return (
                    <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                      Error processing position details: {error instanceof Error ? error.message : 'Unknown error'}
                    </div>
                  );
                }
              } else {
                return (
                  <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                    Unable to fetch position details: {(toolInvocation.result?.message as string) || 'Unknown error'}
                  </div>
                );
              }
            default:
              return null;
          }
        } else if (toolInvocation.toolName === 'getPortfolio') {
          switch (toolInvocation.state) {
            case 'call':
              return <div key={`tool-${partIndex}`} className="py-0">Fetching your portfolio data...</div>;
            case 'result':
              if (toolInvocation.result?.status === 'success' && toolInvocation.result?.portfolio) {
                return (
                  <div key={`tool-${partIndex}`} className="py-0 w-full">
                    <PortfolioVisualization portfolio={toolInvocation.result.portfolio as Portfolio} />
                  </div>
                );
              } else {
                return (
                  <div key={`tool-${partIndex}`} className="py-2 text-red-400">
                    Unable to fetch portfolio data: {(toolInvocation.result?.message as string) || 'Unknown error'}
                  </div>
                );
              }
            default:
              return null;
          }
        }

        // For other tool invocations
        return <div key={`text-${partIndex}`} dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} className="prose prose-p:text-sm prose-invert"></div>;
      }
      return null;
    });
  };

  return (
    <div
      className="h-full w-full rounded-md bg-gray-950 relative overflow-hidden"
      style={{
        backgroundColor: `#030712`,
        opacity: 1,
        backgroundImage: `radial-gradient(#0f172a 1.25px, #030712 1.25px)`,
        backgroundSize: `24px 24px`,
      }}
    >
      <Spotlight />

      <AnimatePresence>
        {!connected ? (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="w-full min-h-screen flex items-center justify-center"
          >
            <div className="max-w-xl mx-auto w-full">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-balance mb-3">AI-Powered DeFi Assistant on Aptos</h1>
                <p className="opacity-60 mb-8">
                  AptoMizer simplifies complex crypto operations through natural language interaction and automated portfolio management
                </p>
                <WalletSelector />
              </div>
            </div>
          </motion.div>
        ) : !hasCompletedOnboarding ? (
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="w-full min-h-screen flex items-center justify-center py-10"
          >
            <OnboardingFlow />
          </motion.div>
        ) : messages?.length > 0 ? (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            key="chat"
            className="w-full min-h-screen overflow-y-auto pb-28 pt-20"
            id="chat-container"
          >
            <div className="max-w-2xl mx-auto w-full px-4">
              {messages.map((m, index) => (
                <div className="flex items-start gap-2 mb-2" key={m.id}>
                  {m.role === "assistant" && (
                    <div className="size-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-white/70 mt-2">
                      {(status === 'submitted' || status === 'streaming') && index === messages.length - 1 ? <ThreeDotsLoading className="size-6" /> : <Bot size={16} />}
                    </div>
                  )}
                  <div className={`flex-1 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`relative overflow-hidden inline-block max-w-[85%] text-sm shadow-sm text-white/80 ${m.role === "user"
                        ? "rounded-bl-2xl rounded-t-2xl bg-gradient-to-tr from-gray-900 to-gray-800 border border-gray-700 p-3"
                        : "py-3 w-full"
                        }`}
                    >
                      {renderMessageContent(m as Message)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-1 inset-x-0">
              <div className="max-w-2xl mx-auto px-4">
                <ChatInput input={input} handleOnSubmit={handleOnSubmit} handleInputChange={handleInputChange} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="w-full min-h-screen flex items-center justify-center"
          >
            <div className="max-w-xl mx-auto w-full">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-balance mb-3">AI-Powered DeFi Assistant on Aptos</h1>
                <p className="opacity-60">
                  AptoMizer simplifies complex crypto operations through natural language interaction and automated portfolio management
                </p>
              </div>

              <ChatInput input={input} handleOnSubmit={handleOnSubmit} handleInputChange={handleInputChange} />

              <ChatSuggestions
                suggestions={chatSuggestions}
                onSelect={handleSuggestionSelect}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
