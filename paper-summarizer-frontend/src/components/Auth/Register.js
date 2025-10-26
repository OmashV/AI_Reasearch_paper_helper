import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await register(email, password);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] p-4">
      <div className="w-full max-w-md glass-card p-6">
        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Register</h2>
        {error && <div className="text-red-200 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 bg-glass border border-opacity-6 border-white rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 bg-glass border border-opacity-6 border-white rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button type="submit" className="fancy-btn w-full">
            Register
          </button>
        </form>
        <p className="mt-4 text-gray-300 text-center">
          Already have an account? <Link to="/login" className="text-primary hover:text-accent">Login</Link>
        </p>
      </div>
    </div>
  );
}