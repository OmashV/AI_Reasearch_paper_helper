// src/components/Chat/ChatMessages.js
import React from "react";
import PaperCard from "../Chat/PaperCard"; // adjust path if needed

function formatAiText(text = "") {
  const cleaned = text.replace(/^\*+|\*+$/g, "").replace(/\*\s*(.+?)\s*\*/g, "$1");
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0 && cleaned) {
    const sentences = cleaned.match(/[^.!?]+[.!?]*/g) || [cleaned];
    const grouped = [];
    for (let i = 0; i < sentences.length; i += 2) {
      grouped.push((sentences[i] || "") + (sentences[i+1] || ""));
    }
    return grouped.map(s => s.trim()).filter(Boolean);
  }

  return paragraphs;
}

export default function ChatMessages({ messages = [], typingStatus = null }) {
  return (
    <div className="flex flex-col overflow-y-auto chat-scrollbar h-full px-2 py-2">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <div key={m.id} className="flex w-full">
              <div className="ml-auto max-w-[80%]">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-2xl text-sm break-words shadow-sm">
                  {String(m.text)}
                </div>
              </div>
            </div>
          );
        }

        if (m.role === "typing") {
          if (typingStatus) {
            return (
              <div key={m.id} className="flex w-full items-center">
                <div className="max-w-[80%]">
                  <div className="bg-zinc-700 text-gray-200 px-4 py-2 rounded-2xl text-sm flex items-center gap-3">
                    <div className="flex-1 break-words" aria-live="polite">
                      {typingStatus.text}
                      <span className="ml-1">{typingStatus.dots}</span>
                    </div>
                    <svg className="w-4 h-4 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.12" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="flex w-full items-center">
              <div className="max-w-[80%]">
                <div className="bg-zinc-700 text-gray-200 px-4 py-2 rounded-2xl text-sm">
                  Typing...
                </div>
              </div>
            </div>
          );
        }

        if (m.role === "ai") {
          const paragraphs = formatAiText(m.text);
          return (
            <div key={m.id} className="flex w-full items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold shadow">
                  AI
                </div>
              </div>

              <div className="max-w-[92%]">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-100">Assistant</div>
                  <div className="text-xs text-gray-500 px-2 py-0.5 rounded bg-white/3">Summary</div>
                  <div className="ml-auto text-xs text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}</div>
                </div>

                <div className="mt-2 bg-zinc-800/60 px-4 py-3 rounded-xl text-sm text-gray-100 leading-relaxed space-y-3 shadow-sm">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="m-0 break-words">
                      {p}
                    </p>
                  ))}
                </div>

                {Array.isArray(m.papers) && m.papers.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {m.papers.map((p, idx) => {
                      const paperObj = p.paper ?? p;
                      const summary = p.summary ?? (p.summary_text ?? null);
                      const highlights = p.highlights ?? (p.highlights_list ?? null);
                      const citation = p.citation ?? (p.citations?.[0] ?? null);

                      return (
                        <div key={`${m.id}-paper-${idx}`} className="animate-fade-in">
                          <PaperCard
                            paper={paperObj}
                            summary={summary}
                            highlights={highlights}
                            citation={citation}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-400">
                  Need more detail? Ask me to expand any summary or open a paper.
                </div>
              </div>
            </div>
          );
        }

        if (m.role === "error") {
          return (
            <div key={m.id} className="flex w-full">
              <div className="max-w-[80%]">
                <div className="bg-red-700/80 text-white px-4 py-2 rounded-2xl text-sm">
                  {String(m.text)}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={m.id} className="flex w-full">
            <div className="max-w-[80%]">
              <div className="bg-zinc-800 text-gray-100 px-4 py-2 rounded-2xl text-sm">
                {typeof m === "string" ? m : String(m?.text ?? JSON.stringify(m))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
