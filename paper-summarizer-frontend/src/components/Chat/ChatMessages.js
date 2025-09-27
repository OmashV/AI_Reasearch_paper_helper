import { useEffect, useRef } from 'react';
import PaperCard from './PaperCard';

export default function ChatMessages({ messages, papersGroups = [] }) {
  // messages: array of { type, text }
  // papersGroups: array where each entry is an array of paper objects corresponding to an AI reply

  let aiIndex = 0;
  const containerRef = useRef(null);

  useEffect(() => {
    // scroll to bottom when messages change
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, papersGroups]);

  return (
  <div ref={containerRef} className="flex flex-col gap-4 p-4 overflow-y-auto" id="chat-scroll-area">
      {messages.map((m, i) => {
        const raw = String(m.type || '').toLowerCase();
        const isUser = raw === 'user' || raw === 'you' || raw === 'me';
        const isAI = raw === 'ai' || raw === 'assistant';
        const label = isUser ? 'You' : isAI ? 'AI Helper' : (m.type || '');

        const messageNode = (
          <div
            key={`msg-${i}`}
            className={`max-w-[80%] p-3 rounded-lg text-black ${isUser ? 'self-end bg-gradient-to-r from-blue-200 to-blue-100 text-right' : 'self-start bg-white/6 border border-white/6 text-left'}`}
          >
            <div className="text-xs text-primary mb-1">{label}:</div>
            <div className="whitespace-pre-wrap">
              {m.type === 'typing' ? (
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        );

        const nodes = [messageNode];

        if (isAI) {
          const papersForThisAI = papersGroups[aiIndex];
          if (Array.isArray(papersForThisAI) && papersForThisAI.length > 0) {
            const papersNodes = papersForThisAI.map((p, idx) => (
              <PaperCard
                key={`paper-${i}-${idx}`}
                paper={p.paper}
                summary={p.summary}
                highlights={p.highlights}
                citation={p.citation}
              />
            ));
            nodes.push(...papersNodes);
          }
          aiIndex += 1;
        }

        return nodes;
      })}
    </div>
  );
}
