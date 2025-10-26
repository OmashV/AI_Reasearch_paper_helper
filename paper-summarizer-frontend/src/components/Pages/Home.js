// components/Pages/Home.js
import React from 'react';
import StarBackground from '../Layout/StarBackground';
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center h-[calc(100vh-64px)] p-4 overflow-hidden">
      {/* Global starfield background (appended to body by StarBackground) */}
      <StarBackground />

      {/* subtle grid / scanline overlay for futuristic feel */}
      <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-10">
        <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_15px,rgba(0,255,247,0.02)_16px)]" />
      </div>

      {/* Content Card */}
      <div className="relative z-10 max-w-xl w-full bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] border border-white/6 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        <h1 className="text-3xl font-semibold text-gray-100 mb-3 text-center">
          Welcome to SummIT
        </h1>
        <p className="text-gray-300 text-center max-w-md mx-auto">
          Explore academic papers, get concise summaries, and chat with an AI assistant powered by King Omash.
        </p>

        <div className="flex justify-center mt-6">
      <Link
        to="/chat"
        state={{ newChat: true }}
        className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-400/20 to-blue-400/10 border border-cyan-400/25 hover:scale-[1.02] transition-transform duration-200"
      >
        Start Chatting
      </Link>

          
        </div>

        <p className="mt-4 text-xs text-gray-400 text-center">distraction-free.</p>
      </div>


      {/* bottom subtle footer */}
      <div className="absolute bottom-6 z-10 text-center w-full">
        <span className="text-xs text-gray-500">Built with care • 2025</span>
      </div>
    </div>
  );
}
