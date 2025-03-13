"use client";

import ThreeDotsLoading from "@/components/icon/three-dots-loading";
import { ChatInput } from "@/components/ui/chat-input";
import { Spotlight } from "@/components/ui/spotlight";
import { useChat } from "@ai-sdk/react";
import { Bot } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { marked } from "marked";

export default function Home() {
  const { messages, status, input, handleInputChange, handleSubmit } = useChat();

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLDivElement>) => {
    handleSubmit(e);
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
        {messages?.length > 0 ? (
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
                <div className="flex items-end gap-2 mb-2" key={m.id}>
                  {m.role === "assistant" && (
                    <div className="size-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-white/70">
                      {(status === 'submitted' || status === 'streaming') && index === messages.length - 1 ? <ThreeDotsLoading className="size-6" /> : <Bot size={16} />}
                    </div>
                  )}
                  <div className={`flex-1 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`relative overflow-hidden inline-block max-w-[80%] text-sm shadow-sm text-white/80 ${m.role === "user"
                        ? "rounded-bl-2xl rounded-t-2xl bg-gradient-to-tr from-gray-900 to-gray-800 border border-gray-700 p-3"
                        : "rounded-br-2xl"
                        }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }}
                        className={`${m.role === "assistant" ? "prose prose-p:text-sm prose-invert" : ""}`}
                      ></div>
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
            transition={{ type: "spring", duration: 0.3 }} className="w-full min-h-screen flex items-center justify-center">
            <div className="max-w-xl mx-auto w-full">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-balance mb-3">AI-Powered DeFi Assistant on Aptos</h1>
                <p className="opacity-60">
                  AptoMizer simplifies complex crypto operations through natural language interaction and automated portfolio management
                </p>
              </div>

              <ChatInput input={input} handleOnSubmit={handleOnSubmit} handleInputChange={handleInputChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
