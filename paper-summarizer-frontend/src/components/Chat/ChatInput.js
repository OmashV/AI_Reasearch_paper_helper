import React, { useState, useEffect } from 'react';
import { Mic, X, Check } from 'lucide-react';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    return () => {
      if (recognition) recognition.stop();
    };
  }, [recognition]);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
      stopListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setText(transcript);
    };

    recog.start();
    setRecognition(recog);
  };

  const stopListening = () => {
    if (recognition) recognition.stop();
    setListening(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
      className="flex w-full items-center gap-2"
    >
      {/* Input */}
      <div className={`flex-1 relative`}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your query..."
          className={`w-full p-3 bg-black text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition`}
        />

        {/* Wave animation */}
        {listening && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-[2px] h-full items-center">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[2px] bg-cyan-400 animate-wave"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    height: `${20 + Math.random() * 40}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cancel/Confirm buttons */}
        {listening && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
            <button
              type="button"
              onClick={stopListening}
              className="bg-cyan-500 hover:bg-cyan-600 p-2 rounded-full flex items-center justify-center transition"
              title="Cancel"
            >
              <X size={14} className="text-white" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="bg-cyan-500 hover:bg-cyan-600 p-2 rounded-full flex items-center justify-center transition"
              title="Send"
            >
              <Check size={14} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Mic Button */}
      {!listening && (
        <button
          type="button"
          onClick={startListening}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-600 transition"
          title="Start speaking"
        >
          <Mic size={16} className="text-white" />
        </button>
      )}

      {/* Default Send Button */}
      {!listening && (
        <button
          type="submit"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-600 transition"
        >
          <Check size={16} className="text-white" />
        </button>
      )}

      {/* Wave animation keyframes */}
      <style>{`
        @keyframes wave {
          0%, 40%, 100% { transform: scaleY(0.3); }
          20% { transform: scaleY(1); }
        }
        .animate-wave {
          display: inline-block;
          transform-origin: center;
          animation: wave 1s infinite ease-in-out;
        }
      `}</style>
    </form>
  );
}
