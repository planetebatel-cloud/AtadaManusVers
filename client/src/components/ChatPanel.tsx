/*
 * ATADA — ChatPanel (Universal AI)
 * - Real M2.7 streaming via /api/chat/stream
 * - Image attach → MiniMax VLM pre-pass
 * - 🔊 button per AI message → MiniMax T2A (requires upgraded plan)
 * - Conversation history forwarded to backend for multi-turn context
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Paperclip, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "@/lib/data";
import { getNextAiResponse } from "@/lib/data";
import { streamChat, textToSpeech, fileToBase64, type ChatHistoryItem } from "@/lib/api";

// Module-level flag: once TTS returns a plan-lock error, hide the speaker
// button for the rest of the session instead of letting users smash it.
let ttsBlocked = false;

// ─── ChatMessage ──────────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessage;
  index: number;
}

function SpeakButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [hidden, setHidden] = useState(ttsBlocked);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (hidden) return null;

  const handleClick = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    setState("loading");
    try {
      const url = await textToSpeech(text);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      await audio.play();
      setState("playing");
    } catch (err) {
      const msg = String((err as Error)?.message || "");
      const planLocked = /Token Plan|usage limit|2056/i.test(msg);
      if (planLocked) {
        ttsBlocked = true;
        toast("Voice playback requires a MiniMax plan upgrade — hiding speaker button.");
        setHidden(true);
      } else {
        toast.error("Couldn't play voice — try again later.");
        setState("idle");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Read aloud"
      className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-[#F5F5F5] transition-all opacity-40 hover:opacity-100 disabled:opacity-30 align-middle"
      disabled={state === "loading"}
    >
      <Volume2
        size={11}
        className={state === "playing" ? "text-[#0A0A0A]" : "text-[#808080]"}
      />
    </button>
  );
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
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", lineHeight: "1.5" }}>
          {message.content}
          {isAi && message.content && <SpeakButton text={message.content} />}
        </p>
      </div>
    </motion.div>
  );
}

// ─── InputBar ─────────────────────────────────────────────────────────────────

interface InputBarProps {
  onSend: (message: string, image?: { b64: string; mime: string; name: string }) => void;
  placeholder?: string;
}

export function InputBar({ onSend, placeholder = "Ask about a job..." }: InputBarProps) {
  const [value, setValue] = useState("");
  const [attached, setAttached] = useState<{ b64: string; mime: string; name: string } | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && !attached) return;
    onSend(value.trim() || "Describe this image.", attached || undefined);
    setValue("");
    setAttached(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPickError("Image files only");
      setTimeout(() => setPickError(null), 2000);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPickError("Max 8 MB");
      setTimeout(() => setPickError(null), 2000);
      return;
    }
    const { b64, mime } = await fileToBase64(file);
    setAttached({ b64, mime, name: file.name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col border-t border-[#ECECEC] bg-white">
      {attached && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#F5F5F5] text-[11px]" style={{ fontFamily: "'DM Mono', monospace" }}>
            <span className="truncate max-w-[140px]">📎 {attached.name}</span>
            <button type="button" onClick={() => setAttached(null)} className="text-[#808080] hover:text-[#0A0A0A]">
              <X size={11} />
            </button>
          </div>
        </div>
      )}
      {pickError && (
        <div className="px-4 pt-2 text-[11px] text-[#C44]" style={{ fontFamily: "'DM Mono', monospace" }}>
          {pickError}
        </div>
      )}
      <div className="flex items-center gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePick}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image (vision)"
          className="w-8 h-8 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center flex-shrink-0 hover:border-[#0A0A0A] transition-all"
        >
          <Paperclip size={13} className="text-[#808080]" />
        </button>
        <input
          className="atada-input flex-1"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attached ? "Add a question (or send to describe)…" : placeholder}
        />
        <button
          type="submit"
          disabled={!value.trim() && !attached}
          className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-default transition-all hover:shadow-md"
          style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
        >
          <ArrowUp size={14} className="text-white" />
        </button>
      </div>
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
  { id: "init_1", role: "ai", content: "I can help you explore these job listings. Ask me anything, or attach a screenshot.", timestamp: new Date() },
];

export function ChatPanel({ initialMessages, className = "", compact = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || defaultMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derived: typing indicator visible iff the latest message is from the user
  // (AI hasn't started replying yet). No risk of stuck indicators — it's
  // computed every render from authoritative state.
  const isTyping = messages.length > 0 && messages[messages.length - 1].role === "user";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string, image?: { b64: string; mime: string; name: string }) => {
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: image ? `${content} 📎 ${image.name}` : content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);

    // Build history from current state (excluding the just-added user msg —
    // the backend treats the `message` field as the latest user turn).
    const history: ChatHistoryItem[] = messages
      .filter(m => m.content)
      .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));

    const aiMsgId = `ai_${Date.now()}`;
    let aiContent = "";

    try {
      for await (const chunk of streamChat(content, {
        history,
        imageB64: image?.b64,
        imageMime: image?.mime,
      })) {
        if (chunk.type === "text_chunk" && chunk.content) {
          aiContent += chunk.content;
          setMessages(prev => {
            const existing = prev.find(m => m.id === aiMsgId);
            if (existing) {
              return prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m);
            }
            return [...prev, { id: aiMsgId, role: "ai" as const, content: aiContent, timestamp: new Date() }];
          });
        }
        if (chunk.type === "done") break;
      }

      if (!aiContent) {
        setMessages(prev => [...prev, { id: aiMsgId, role: "ai" as const, content: getNextAiResponse(), timestamp: new Date() }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: aiMsgId, role: "ai" as const, content: getNextAiResponse(), timestamp: new Date(),
      }]);
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
              key="typing-indicator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
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
