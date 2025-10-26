// src/components/Pages/EmptyState.js
import React from "react";
import ChatInput from "../Chat/ChatInput";

export default function EmptyState({ emptyExpanded, onStart, onNew }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      {/* Chat box */}
      <div
        className={`bg-zinc-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-out
          ${emptyExpanded ? "h-auto" : "h-48"} w-full max-w-2xl`}
      >
        <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-800/70 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.16 0-2.253-.176-3.2-.498L3 21l1.498-5.801C3.605 14.493 3 13.28 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-100">Start a new conversation</h3>
            <p className="mt-1 text-sm text-gray-400">
              Ask about papers, request summaries, or paste text to get started.
            </p>
          </div>

          <div className="w-full max-w-2xl mt-2">
            {/* Show ChatInput immediately */}
            <ChatInput
              onSend={(txt) => {
                if (typeof onStart === "function") onStart(txt);
              }}
              autoFocus={true}
            />
          </div>

          <div className="w-full px-6 mt-2">
            <div className="text-sm text-gray-300">Tip: paste a DOI, title, or a short query.</div>
          </div>
        </div>
      </div>

      {/* New chat button outside the box */}
      <div>
        <button
          onClick={onNew}
          className="inline-flex items-center px-4 py-2 bg-zinc-700 text-white text-sm rounded-md shadow-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          New chat
        </button>
      </div>
    </div>
  );
}
