import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  LogIn,
  UserPlus,
  MessageCircle,
  Home,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

function PlanDropdown({ currentPlan = "Free", onUpgradeClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("pointerdown", onDocClick);
    return () => window.removeEventListener("pointerdown", onDocClick);
  }, []);

  return (
    <div className="relative z-[9999]" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-400/30 hover:to-blue-400/30 transition text-sm text-gray-100 font-medium"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Plan"
      >
        <span className="text-xs uppercase tracking-wider">{currentPlan}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-3 overflow-visible"
            role="menu"
            aria-label="Plan menu"
          >
            <div className="px-4 py-2">
              <div className="text-xs text-gray-400">Current plan</div>
              <div className="mt-1 text-sm font-semibold text-white">{currentPlan}</div>

            </div>

            <div className="px-4 py-2 border-t border-white/10 mt-2">
              <button
                onClick={() => {
                  setOpen(false);
                  onUpgradeClick();
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-black py-2 rounded-lg text-sm font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              >
                Upgrade to Premium
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UpgradeModal({ open, onClose, onConfirmUpgrade }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: 12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 12, scale: 0.98 }}
            className="relative z-[10001] max-w-5xl w-full bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Upgrade to Premium"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <div className="text-lg font-bold text-white">Upgrade to Premium</div>
                <div className="text-xs text-gray-400">More power for deep research and larger context</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open("https://your-billing-docs.example", "_blank")}
                  className="text-xs text-gray-300 px-3 py-1 rounded hover:bg-white/5 flex items-center gap-2"
                >
                  Billing help <ExternalLink size={14} />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-300 px-3 py-1 rounded hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Free Plan */}
              <div className="rounded-xl p-5 border border-white/10 bg-zinc-900/80 hover:scale-[1.01] transition transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Free</div>
                    <div className="text-xs text-gray-400">$0 / month</div>
                  </div>
                  <div className="text-xs text-gray-400">Your current plan</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  <li>• Access to Cosmo-RP (limited)</li>
                  <li>• Up to 3 related papers per query</li>
                  <li>• Summaries, abstracts, highlights, APA & BibTeX citations</li>
                  <li>• Limited file uploads & slower processing</li>
                  <li>• Shorter memory/context window</li>
                </ul>
                <div className="mt-6 text-xs text-gray-400">
                  Good for casual research and lightweight summarization.
                </div>
              </div>

              {/* Premium Plan */}
              <div className="rounded-xl p-5 bg-gradient-to-tr from-cyan-700/20 to-blue-700/20 border border-white/20 hover:scale-[1.01] transition transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Premium</div>
                    <div className="text-xs text-gray-300">$5 USD / month</div>
                  </div>
                  <div className="text-xs text-amber-300 font-semibold">Recommended</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-100">
                  <li>• Expanded access to Cosmo-RP (priority compute)</li>
                  <li>• Up to 5 related papers per query</li>
                  <li>• Faster summarization & higher quality outputs</li>
                  <li>• Longer memory/context for multi-step projects</li>
                  <li>• Larger file uploads for deep research</li>
                  <li>• Projects, saved workspaces, custom prompts & exportable notes</li>
                </ul>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => onConfirmUpgrade && onConfirmUpgrade()}
                    className="bg-gradient-to-r from-cyan-500 to-green-500 text-black px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition"
                  >
                    Start Premium - $5/mo
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-100 hover:bg-white/5 transition"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 text-xs text-gray-400">
              <strong>Note:</strong> Limits and pricing may vary by region.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Header() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [plan, setPlan] = useState("Free");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "Home", icon: <Home size={16} /> },
    { to: "/chat", label: "Chat", icon: <MessageCircle size={16} /> },
  ];

  const handleConfirmUpgrade = () => {
    setPlan("Premium");
    setUpgradeOpen(false);
    setTimeout(() => alert("Upgraded to Premium (demo)."), 100);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 h-16 z-[5000] backdrop-blur-md bg-zinc-900/50 border-b border-white/10 shadow-md"
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent select-none"
            >
              SummIT
            </Link>

            <PlanDropdown
              currentPlan={plan}
              onUpgradeClick={() => setUpgradeOpen(true)}
            />
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            {navLinks.map(({ to, label, icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-inner"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              );
            })}

            {token ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-300 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-gray-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 text-gray-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  <UserPlus size={16} />
                  <span>Register</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </motion.header>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onConfirmUpgrade={handleConfirmUpgrade}
      />
    </>
  );
}
