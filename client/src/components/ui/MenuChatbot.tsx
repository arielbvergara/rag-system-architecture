"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const CHATBOT_MAX_INPUT_LENGTH = 500;

type Message = {
  role: "user" | "assistant";
  text: string;
};

export function MenuChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  async function handleSend() {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    const res = await api.chat.send({ message: trimmed });

    if (res.success && res.data) {
      setMessages((prev) => [...prev, { role: "assistant", text: res.data!.reply }]);
    } else {
      setError(res.error ?? "Something went wrong. Please try again.");
    }

    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg flex flex-col overflow-hidden"
          style={{ maxHeight: "480px" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--foreground)]">Menu Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150 text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-[var(--muted)] text-sm text-center">
                Ask me anything about our menu!
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--border)] text-[var(--foreground)]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--border)] text-[var(--muted)] rounded-lg px-3 py-2 text-sm">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-center text-[var(--error,#ef4444)]">{error}</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--border)] flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={CHATBOT_MAX_INPUT_LENGTH}
              placeholder="Ask about our menu…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || inputValue.trim() === ""}
              className="rounded-lg bg-[var(--accent)] text-white text-sm px-3 py-2 hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity duration-150"
        aria-label="Open menu chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.155L9.6 21.5a.75.75 0 0 1-1.35-.468v-2.996a48.957 48.957 0 0 1-3.402-.384c-1.978-.292-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
