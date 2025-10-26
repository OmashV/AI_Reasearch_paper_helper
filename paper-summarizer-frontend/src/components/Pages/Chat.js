// src/components/Pages/Chat.js
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ChatInput from "../Chat/ChatInput";
import ChatMessages from "../Chat/ChatMessages";
import HistorySidebar from "./HistorySidebar";
import EmptyState from "./EmptyState";
import { chatRequest } from "../../services/api";

/*
Overview:
- sessions = array of saved chat sessions [{ id, title, messages: [], papersGroups, createdAt }]
- currentSessionId = id of currently open session (null when no session open)
- messages state mirrors current session's messages for rendering & editing
*/

const STORAGE_KEY = "chat_sessions_v1";

// helper: make a compact, friendly title from first user text (no fixed prefix)
const makeTitleFromText = (text) => {
  if (!text) return "New Chat";
  const clean = text.trim().replace(/\s+/g, " ");
  // take first 6 words or up to 40 chars
  const words = clean.split(" ").slice(0, 6).join(" ");
  const short = words.length <= 40 ? words : clean.slice(0, 40).trim() + "…";
  return short;
};

export default function Chat() {
  const { token } = useAuth();
  const messagesRef = useRef(null);

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    // if you want to auto-open last session, return sessions[sessions.length-1]?.id
    return null;
  });

  const [messages, setMessages] = useState([]);
  const [papersGroups, setPapersGroups] = useState([]);

  const [emptyExpanded, setEmptyExpanded] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  
  // keep them in sync with resize
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- typing status UI state & helpers ---
  const [typingStatus, setTypingStatus] = useState(null); // { text: string, dots: string }

  // constants
  const SIDEBAR_WIDTH = 256; // px - sidebar width on desktop
  const MOBILE_OVERLAY_SHIFT = 0; // keep 0 on mobile so overlay doesn't push content

  // computed margin left used to push main content to the right on desktop
  const computedMarginLeft = isSidebarOpen && isDesktop ? SIDEBAR_WIDTH : 0;

  // messages to cycle through while waiting
  const TYPING_MESSAGES = [
    "Thinking",
    "Searching for relevant papers",
    "Analyzing results",
    "Summarizing paper contents",
    "Producing a clear answer",
    "Almost done"
  ];

  const typingDotsIntervalRef = useRef(null);
  const typingMessageIntervalRef = useRef(null);
  const typingMessageIndexRef = useRef(0);

  // start the typing status cycle
  function startTypingStatus(initialText = null) {
    // start with either provided initialText or first in list
    const base = initialText || TYPING_MESSAGES[0];
    typingMessageIndexRef.current = TYPING_MESSAGES.indexOf(base);
    if (typingMessageIndexRef.current === -1) typingMessageIndexRef.current = 0;

    // reset status immediately
    setTypingStatus({ text: TYPING_MESSAGES[typingMessageIndexRef.current], dots: "" });

    // dots update every 500ms -> ".", "..", "..."
    if (typingDotsIntervalRef.current) clearInterval(typingDotsIntervalRef.current);
    typingDotsIntervalRef.current = setInterval(() => {
      setTypingStatus((prev) => {
        if (!prev) return { text: TYPING_MESSAGES[typingMessageIndexRef.current], dots: "." };
        const nd = prev.dots.length >= 4 ? "" : prev.dots + ".";
        return { ...prev, dots: nd };
      });
    }, 2500);

    // rotate the base message every 6000ms
    if (typingMessageIntervalRef.current) clearInterval(typingMessageIntervalRef.current);
    typingMessageIntervalRef.current = setInterval(() => {
      typingMessageIndexRef.current = (typingMessageIndexRef.current + 1) % TYPING_MESSAGES.length;
      setTypingStatus({ text: TYPING_MESSAGES[typingMessageIndexRef.current], dots: "" });
    }, 10000);
  }

  // stop and clear intervals
  function stopTypingStatus() {
    setTypingStatus(null);
    if (typingDotsIntervalRef.current) {
      clearInterval(typingDotsIntervalRef.current);
      typingDotsIntervalRef.current = null;
    }
    if (typingMessageIntervalRef.current) {
      clearInterval(typingMessageIntervalRef.current);
      typingMessageIntervalRef.current = null;
    }
    typingMessageIndexRef.current = 0;
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingDotsIntervalRef.current) clearInterval(typingDotsIntervalRef.current);
      if (typingMessageIntervalRef.current) clearInterval(typingMessageIntervalRef.current);
    };
  }, []);

  // helper: persist sessions
  const saveSessions = (nextSessions) => {
    // update React state and localStorage in one place
    setSessions(nextSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
    } catch (e) {
      console.warn("Failed to write sessions to localStorage", e);
    }
  };

  const createNewSession = (initialTitle = null) => {
    const id = Date.now().toString();
    const title = initialTitle || "New Chat";
    const newSession = {
      id,
      title,
      messages: [],
      papersGroups: [],
      createdAt: new Date().toISOString(),
    };

    // functional update to avoid stale closures
    setSessions((prev) => {
      const next = [...prev, newSession];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to write sessions to localStorage", e);
      }
      return next;
    });

    // set current session and UI states
    setCurrentSessionId(id);
    setMessages([]); // start empty messages for UI
    setPapersGroups([]);
    setEmptyExpanded(true);
    setIsSidebarOpen(false);

    return id;
  };

  // load session into current view
  const loadSession = (sessionId) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return;
    setCurrentSessionId(sessionId);
    setMessages(s.messages || []);
    setPapersGroups(s.papersGroups || []);
    setIsSidebarOpen(false);
    setEmptyExpanded(false);
  };

  // update session (persist messages/papersGroups and update title if needed)
  const persistCurrentSession = (sessionId, partial = {}) => {
    if (!sessionId) return;
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId) return s;
        const merged = { ...s, ...partial };

        // if title missing or "New Chat", try to set from first user message
        if (!merged.title || merged.title === "New Chat") {
          const firstUser = (merged.messages || []).find((m) => m.type === "User" || m.role === "user");
          if (firstUser && firstUser.text) {
            merged.title = makeTitleFromText(firstUser.text);
          }
        }
        return merged;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist sessions to localStorage", e);
      }
      return next;
    });
  };

  const handleSend = async (text) => {
    // ensure current session exists (create with title from first message if needed)
    let sessionId = currentSessionId;
    if (!sessionId) {
      const generatedTitle = makeTitleFromText(text);
      sessionId = createNewSession(generatedTitle);
    }

    // make stable ids for message items
    const uid = Date.now().toString();
    const userMsg = { id: `u-${uid}`, role: "user", text, createdAt: new Date().toISOString() };
    const typingMsg = { id: `t-${uid}`, role: "typing", text: "", createdAt: new Date().toISOString() };

    // add user and typing placeholder to UI and persist the partial session
    setMessages((prev) => {
      const next = [...prev, userMsg, typingMsg];
      persistCurrentSession(sessionId, { messages: next });
      return next;
    });

    // start the friendly typing status (rotating messages + ellipsis)
    startTypingStatus();

    try {
      const res = await chatRequest(text, 3, token);

      // stop typing status immediately when response arrives
      stopTypingStatus();

      const group = (res.papers || []).map((paper, i) => ({
        paper,
        summary: res.summaries?.[i]?.summary || "No summary available",
        highlights: Array.isArray(res.summaries?.[i]?.highlights) ? res.summaries[i].highlights : [],
        citation: res.citations?.[i] || null,
      }));

      const aiMsg = {
        id: `ai-${uid}`,
        role: "ai",
        text: res.chat_response || "No chat response available",
        papers: group,
        createdAt: new Date().toISOString(),
      };

      // replace typing placeholder with ai message in state and persist
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.id === typingMsg.id);
        if (idx !== -1) copy.splice(idx, 1, aiMsg);
        else copy.push(aiMsg);

        persistCurrentSession(sessionId, { messages: copy });
        return copy;
      });
    } catch (err) {
      // stop typing status on error as well
      stopTypingStatus();

      const errorMsg = {
        id: `err-${uid}`,
        role: "error",
        text: err.message || "Failed to fetch papers",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.id === typingMsg.id);
        if (idx !== -1) copy.splice(idx, 1, errorMsg);
        else copy.push(errorMsg);

        persistCurrentSession(sessionId, { messages: copy });
        return copy;
      });
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 60);
  }, [messages]);

  // delete session
  const removeSession = (sessionId) => {
    const next = sessions.filter((s) => s.id !== sessionId);
    saveSessions(next);
    if (currentSessionId === sessionId) {
      // close current view
      setCurrentSessionId(null);
      setMessages([]);
      setPapersGroups([]);
    }
  };

  // rename session - NEW FUNCTION
  const renameSession = (sessionId, newTitle) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id === sessionId) {
          return { ...s, title: newTitle };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist sessions to localStorage", e);
      }
      return next;
    });
  };

  const isChatEmpty = messages.length === 0;

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-transparent">
      <HistorySidebar
        sessions={sessions}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        onSelect={(id) => loadSession(id)}
        onNew={() => createNewSession()}
        onDelete={(id) => removeSession(id)}
        onRename={(id, newTitle) => renameSession(id, newTitle)}
      />

      {/* Floating Show History when closed */}
      {!isSidebarOpen && (
        <button
          className="fixed top-[84px] left-4 z-50 bg-zinc-800/85 text-gray-100 px-3 py-2 rounded-lg shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          onClick={() => setIsSidebarOpen(true)}
          aria-expanded={isSidebarOpen}
          aria-controls="chat-history-sidebar"
          title="Show History"
          style={{ left: "16px" }}
        >
          Show History
        </button>
      )}

      {/* Main area */}
      <main
        className="transition-all duration-300 flex-1 flex flex-col"
        style={{ marginLeft: computedMarginLeft }}
      >
        <div className="mt-16 px-4 md:px-8 pt-6 pb-6">
          <div className="w-full max-w-6xl mx-auto">
            {isChatEmpty ? (
              <EmptyState
                emptyExpanded={emptyExpanded}
                onExpand={() => setEmptyExpanded(true)}
                onStart={(txt) => {
                  setEmptyExpanded(true);
                  handleSend(txt);
                }}
                onNew={() => createNewSession()}
              />
            ) : (
              <div className="flex flex-col rounded-3xl bg-zinc-900/90 shadow-2xl backdrop-blur-md overflow-hidden border border-white/10 h-[calc(100vh-64px-6rem)]">
                <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={messagesRef}>
                  <ChatMessages messages={messages} typingStatus={typingStatus} />
                </div>

                <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-zinc-800/90 to-transparent border-t border-white/6">
                  <ChatInput onSend={handleSend} />
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-xs text-gray-400">
              Powered by Viduranga MAO • 2025
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}