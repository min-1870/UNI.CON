import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
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
        <h2 id="register-title">Register</h2>
        <form onSubmit={handleRegister} id="register-form">
          <div id="register-inputGroup">
            <label htmlFor="email">Email:</label>
            <input
              
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              className='register-input'
            />
          </div>
          <div id="register-inputGroup">
            <label htmlFor="password">Password:</label>
            <input
              
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              className='register-input'
            />
          </div>
          {error && <p id="register-error">{error}</p>}
          <button type="submit" id="register-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;