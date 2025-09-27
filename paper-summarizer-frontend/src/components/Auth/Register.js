import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { register } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await register({ email, password });
      login(response.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 glass-card">
      <h2 className="text-2xl font-semibold mb-4">Create account</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="rounded-md bg-transparent border border-white/10 px-4 py-2 outline-none placeholder:text-gray-400 text-black"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="rounded-md bg-transparent border border-white/10 px-4 py-2 outline-none placeholder:text-gray-400 text-black"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button className="fancy-btn" type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;