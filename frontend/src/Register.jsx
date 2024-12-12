import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleNavigateToLogin = () => {
    navigate("/");
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill out both fields.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/account/register/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'email':email, 'password':password }),
      });
      console.log(response.status);

      if (response.status === 201) {
        response.json().then((data) => {
          localStorage.setItem('access', data.access);
          localStorage.setItem('refresh', data.refresh);
          localStorage.setItem('user', data.user);
          navigate("/validation");
        }).catch((error) => {
          console.error('Error parsing JSON:', error);
        });
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
    <div id="register-container">
      <div id="register">
        <div id="register-title-description">
          <div id="register-title">Welcome</div>
          <div id="register-description">Sign up quickly and easily to unlock all the features of UNI.CON.</div>
        </div>
        
        <form onSubmit={handleRegister} id="register-form">
            <label htmlFor="email">School Email</label>
            <input
              
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="register-email"
              placeholder='Your School Email (@XX.edu)'
            />
            <label htmlFor="password">Password</label>
            <input
              
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="register-password"
              
              placeholder='Your Password'
              
            />
          {error && <p id="register-error">{error}</p>}
          <button type="submit" id="register-button" disabled={loading}>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>
          <div id="register-sign-in-container">
            <div id="register-sign-in-description">Don't have an account?</div>
            <span id="register-sign-in-link" onClick={handleNavigateToLogin}>Sign In</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;