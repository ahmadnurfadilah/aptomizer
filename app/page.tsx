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
    { text: "Show me my transaction history", icon: <SendToBack size={16} /> },
    { text: "How can I stake APT?", icon: <Wallet size={16} /> },
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
                  <div className="prose prose-p:text-sm prose-invert">Here are the pools:</div>
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
                  <div className="prose prose-p:text-sm prose-invert">Here is the pool details:</div>
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
                    <div className="prose prose-p:text-sm prose-invert">Here are the best yield opportunities for your profile:</div>
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
