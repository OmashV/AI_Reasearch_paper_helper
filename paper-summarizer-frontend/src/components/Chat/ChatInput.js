import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-3 mt-4">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your query..."
        className="flex-1 rounded-md border border-blue-600 px-4 py-2 bg-transparent text-black outline-none"
      />
      <button
        onClick={handleSend}
        className="rounded-md px-4 py-2 bg-gradient-to-r from-teal-400 to-blue-600 text-white font-semibold shadow-lg hover:scale-105 transform transition"
      >
        Send
      </button>
    </div>
  );
}
