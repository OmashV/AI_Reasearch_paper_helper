import { useState, useContext } from "react";
import { login } from "../../services/api"; // Fix import
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Add for redirection

export default function Login() {
  const { login: setToken } = useContext(AuthContext); // Rename to avoid conflict
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }); // Pass object
      setToken(res.access_token); // Use access_token
      navigate("/"); // Redirect to main app
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 glass-card">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="rounded-md bg-transparent border border-white/10 px-4 py-2 outline-none placeholder:text-gray-400 text-black"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded-md bg-transparent border border-white/10 px-4 py-2 outline-none placeholder:text-gray-400 text-black"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="fancy-btn" type="submit">Login</button>
      </form>
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}