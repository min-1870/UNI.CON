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
        <div id="login-title">Welcome Back</div>
        <div id="login-description">Enter your email and password to sign in</div>
        <form onSubmit={handleLogin} id="login-form">
          <div id="login-from-input-group">
            <label htmlFor="email" id='login-email-label'>School Email</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder='Your School Email (@XX.edu)'
              onChange={(e) => setEmail(e.target.value)}
              className='login-email'
            />
            <label htmlFor="password" id='login-password-label'>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder='Your Password'
              onChange={(e) => setPassword(e.target.value)}
              className='login-password'
            />
          </div>
          {error && <p id="login-error">{error}</p>}
          <button 
            type="submit" 
            id="login-button"
            disabled={loading}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
        <div id="login-sign-up-container">
          <div id="login-sign-up-description">Don't have an account?</div>
          <span id="login-sign-up-link" onClick={handleNavigateToRegister}>Sign Up</span>
        </div>
      </div>
      <div id="login-logo">
        <p>UNI.CON</p>
      </div>
    </div>
  );
};

export default Login;