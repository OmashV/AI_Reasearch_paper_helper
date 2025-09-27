import { useContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ChatInput from "./components/Chat/ChatInput";
import ChatMessages from "./components/Chat/ChatMessages";
import PaperCard from "./components/Chat/PaperCard";
import { chatRequest } from "./services/api";
import { GlobalStyle } from "./globalStyles";
import Header from "./components/Layout/Header";

function AppContent() {
  const { token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  // papersGroups: array of arrays; each inner array corresponds to one AI reply
  const [papersGroups, setPapersGroups] = useState([]);

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { type: "User", text }]);
    // add a typing indicator message that will be replaced when response arrives
    setMessages((prev) => [...prev, { type: "typing", text: "" }]);
    try {
      const res = await chatRequest(text, 3, token);

      // replace the last typing message with AI message
      setMessages((prev) => {
        const copy = [...prev];
        const lastTypingIndex = copy.map(m => m.type).lastIndexOf('typing');
        if (lastTypingIndex !== -1) {
          copy[lastTypingIndex] = { type: 'AI', text: 'Summaries received' };
        } else {
          copy.push({ type: 'AI', text: 'Summaries received' });
        }
        return copy;
      });

      // create a group for this AI reply
      const group = res.summaries.map((s, i) => ({
        paper: res.papers[i],
        summary: s.summary,
        highlights: s.highlights,
        citation: res.citations[i],
      }));

      setPapersGroups((prev) => [...prev, group]);
    } catch (err) {
      // remove typing and append error
      setMessages((prev) => {
        const copy = [...prev];
        const lastTypingIndex = copy.map(m => m.type).lastIndexOf('typing');
        if (lastTypingIndex !== -1) {
          copy.splice(lastTypingIndex, 1, { type: 'Error', text: err.message });
        } else {
          copy.push({ type: 'Error', text: err.message });
        }
        return copy;
      });
    }
  };

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" style={{ padding: "1rem 2rem" }}>
      <div className="flex-1 overflow-hidden rounded-lg shadow-inner bg-transparent">
        <div className="h-full flex flex-col" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto">
            <ChatMessages messages={messages} papersGroups={papersGroups} />
          </div>
          <div className="sticky bottom-0 bg-transparent pt-4">
            <ChatInput onSend={handleSend} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalStyle />
        <Header />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}