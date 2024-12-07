import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNavigateToRegister = () => {
    navigate("/register");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill out both fields.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/account/login/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 202) {
        const data = await response.json();
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('user', data.user);
        navigate("/community")
      } else if (response.status === 401) {
        setError('Incorrect email or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container">
      <div id="login">
        <h2 id="login-title">Login</h2>
        <form onSubmit={handleLogin} id="login-form">
          <div id="login-inputGroup">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div id="login-inputGroup">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p id="login-error">{error}</p>}
          <button 
            type="submit" 
            id="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
              type="Register"
              id="login-button"
              disabled={loading}
              onClick={handleNavigateToRegister}
            >
              Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;