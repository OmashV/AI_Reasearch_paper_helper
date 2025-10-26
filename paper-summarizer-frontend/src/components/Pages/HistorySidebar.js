// src/components/Pages/HistorySidebar.js
import React, { useEffect, useRef, useState } from "react";

export default function HistorySidebar({
  sessions = [],
  isOpen = false,
  onClose = () => {},
  onOpen = () => {},
  onSelect = () => {},
  onNew = () => {},
  onDelete = () => {},
  onRename = () => {},
}) {
  // which session's menu is open (session id) or null
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  // click outside to close any open menu
  useEffect(() => {
    function handleClick(e) {
      if (!containerRef.current) return;
      // if click is outside the sidebar container, close menus
      if (!containerRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, []);

  const handleRename = (session) => {
    const currentTitle = session.title && session.title !== "New Chat" ? session.title : (session.messages && session.messages.find(m => m.type === "User" || m.role === "user")?.text) || "";
    const promptText = window.prompt("Rename chat", currentTitle || "");
    if (promptText === null) return; // user cancelled
    const newTitle = String(promptText).trim() || "New Chat";
    if (typeof onRename === "function") {
      onRename(session.id, newTitle);
    }
    setOpenMenuId(null);
  };

  const handleDelete = (session) => {
    setOpenMenuId(null);
    if (window.confirm("Delete this chat?")) onDelete(session.id);
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    
    const title = s.title && s.title !== "New Chat" 
      ? s.title 
      : (s.messages && s.messages.find(m => m.type === "User" || m.role === "user")?.text) || "New Chat";
    
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside
      id="chat-history-sidebar"
      className={`fixed left-0 z-50 w-64 transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-hidden={!isOpen}
      style={{ 
        backdropFilter: "blur(8px)",
        top: "64px",
        bottom: "0"
      }}
      ref={containerRef}
    >
      <div className="h-full flex flex-col bg-zinc-900/40 text-gray-100">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <button
              onClick={onClose}
              className="text-gray-300 px-2 py-1 rounded hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close history"
              title="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Saved sessions in this browser</p>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3">
          <button
            onClick={onNew}
            className="w-full bg-primary text-white text-sm py-2 rounded-md hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            + New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg 
                className="h-4 w-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-10 pr-10 py-2 bg-zinc-800/60 border border-white/10 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <svg 
                  className="h-4 w-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search results count */}
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-400 px-1">
              {filteredSessions.length === 0 ? (
                <span className="text-red-400">No chats found</span>
              ) : (
                <span>
                  {filteredSessions.length} {filteredSessions.length === 1 ? 'chat' : 'chats'} found
                </span>
              )}
            </div>
          )}
        </div>

        {/* Session list */}
        <div className="px-3 py-3 overflow-y-auto space-y-2 flex-1">
          {filteredSessions.length === 0 ? (
            <div className="text-gray-400 px-2 text-center py-8">
              {searchQuery ? (
                <div className="space-y-2">
                  <svg 
                    className="h-12 w-12 mx-auto text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                  <p>No chats match your search</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg 
                    className="h-12 w-12 mx-auto text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                    />
                  </svg>
                  <p>No chat history yet.</p>
                </div>
              )}
            </div>
          ) : (
            filteredSessions
              .slice()
              .reverse()
              .map((s) => (
                <div
                  key={s.id}
                  className="relative"
                >
                  {/* Container with flex for title and menu button */}
                  <div className="flex items-start gap-1 relative">
                    {/* clickable title area */}
                    <button
                      onClick={() => {
                        // Only select if menu is not open
                        if (openMenuId !== s.id) {
                          onSelect(s.id);
                        }
                      }}
                      className="flex-1 text-left p-3 rounded-lg hover:bg-zinc-800/60 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                      title={s.title}
                      style={{ minWidth: 0 }}
                    >
                      <div className="min-w-0 w-full">
                        <div className="truncate text-sm text-gray-100 font-medium pr-2">
                          {s.title && s.title !== "New Chat"
                            ? s.title
                            : (s.messages && s.messages.find(m => m.type === "User" || m.role === "user")?.text?.slice(0, 60)) || "New Chat"}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                    </button>

                    {/* overflow menu trigger (three dots) */}
                    <div className="flex-none relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) => (prev === s.id ? null : s.id));
                        }}
                        className="px-2 py-2 rounded-full hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-300 transition-colors duration-150"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === s.id}
                        title="More actions"
                      >
                        <span className="sr-only">Open actions</span>
                        {/* three dots icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-300">
                          <circle cx="5" cy="12" r="1.6" fill="currentColor" />
                          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                          <circle cx="19" cy="12" r="1.6" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* dropdown menu - positioned relative to the parent div */}
                  {openMenuId === s.id && (
                    <>
                      {/* Invisible backdrop to prevent clicks through */}
                      <div 
                        className="fixed inset-0 z-[60]"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div
                        className="absolute right-2 top-12 z-[70] w-44 bg-zinc-800 border border-white/10 rounded-md shadow-xl py-1 backdrop-blur-xl"
                        role="menu"
                        aria-label="Session actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(s);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-zinc-700 transition-colors duration-150"
                          role="menuitem"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Rename
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors duration-150"
                          role="menuitem"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
          )}
        </div>

        {/* footer: clear history */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => {
              if (sessions.length === 0) return;
              if (window.confirm("Clear all history?")) {
                sessions.forEach((s) => onDelete(s.id));
              }
            }}
            disabled={sessions.length === 0}
            className="w-full bg-red-600/80 text-white text-sm py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            Clear History
          </button>
        </div>
      </div>
    </aside>
  );
}