/*
 * ATADA — ChatPanel (Redesigned)
 * Premium depth, shadows, visual hierarchy
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/data";
import { getNextAiResponse } from "@/lib/data";

// ─── ChatMessage ──────────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessage;
  index: number;
}

export function ChatMessageItem({ message, index }: ChatMessageProps) {
  const isAi = message.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`flex ${isAi ? "justify-start" : "justify-end"} mb-3`}
    >
      {isAi && (
        <div
          className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center mr-2 mt-auto flex-shrink-0"
          style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}
        >
          <span className="text-white text-[8px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>AI</span>
        </div>
      )}
      <div className={isAi ? "chat-bubble-ai" : "chat-bubble-user"}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", lineHeight: "1.5" }}>{message.content}</p>
      </div>
    </motion.div>
  );
}

// ─── InputBar ─────────────────────────────────────────────────────────────────

interface InputBarProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function InputBar({ onSend, placeholder = "Ask about a job..." }: InputBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-[#ECECEC] bg-white">
      <input
        className="atada-input flex-1"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-default transition-all hover:shadow-md"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
      >
        <ArrowUp size={14} className="text-white" />
      </button>
    </form>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  initialMessages?: ChatMessage[];
  className?: string;
  compact?: boolean;
}

const defaultMessages: ChatMessage[] = [
  { id: "init_1", role: "ai", content: "I can help you explore these job listings. Ask me anything!", timestamp: new Date() },
];

export function ChatPanel({ initialMessages, className = "", compact = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || defaultMessages);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const { streamChat } = await import("@/lib/api");
      let aiContent = "";
      const aiMsgId = `ai_${Date.now()}`;

      for await (const chunk of streamChat(content)) {
        if (chunk.type === "text_chunk" && chunk.content) {
          aiContent += chunk.content;
          setMessages(prev => {
            const existing = prev.find(m => m.id === aiMsgId);
            if (existing) {
              return prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m);
            }
            return [...prev, { id: aiMsgId, role: "ai" as const, content: aiContent, timestamp: new Date() }];
          });
          setIsTyping(false);
        }
        if (chunk.type === "done") break;
      }

      if (!aiContent) {
        setMessages(prev => [...prev, { id: aiMsgId, role: "ai" as const, content: getNextAiResponse(), timestamp: new Date() }]);
        setIsTyping(false);
      }
    } catch {
      // Fallback to mock
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "ai",
        content: getNextAiResponse(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {!compact && (
        <div className="px-4 py-3 border-b border-[#ECECEC]">
          <span
            className="label-sm"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            AI Assistant
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: 0 }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatMessageItem key={msg.id} message={msg} index={i} />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 mb-3"
            >
              <div
                className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}
              >
                <span className="text-white text-[8px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>AI</span>
              </div>
              <div className="chat-bubble-ai flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#808080]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InputBar onSend={handleSend} />
    </div>
  );
}
