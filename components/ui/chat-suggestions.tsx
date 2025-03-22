"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type SuggestionItem = {
  text: string;
  icon?: React.ReactNode;
};

const ChatSuggestions = ({
  suggestions,
  onSelect
}: {
  suggestions: SuggestionItem[];
  onSelect: (suggestion: string) => void;
}) => {
  return (
    <div className="mt-6">
      <p className="text-sm text-zinc-500 mb-3">Try asking about:</p>
      <div className="w-full flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.05 * index,
              duration: 0.2,
              type: "spring",
              stiffness: 200
            }}
            onClick={() => onSelect(suggestion.text)}
            className={cn(
              "group flex items-center gap-2 rounded-xl bg-zinc-900/50 border border-zinc-800 px-3 py-2",
              "text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700",
              "transition-all ease-in-out duration-200"
            )}
          >
            {suggestion.icon && (
              <span className="text-zinc-500 group-hover:text-white/70 transition-colors">
                {suggestion.icon}
              </span>
            )}
            <span>{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export { ChatSuggestions };
