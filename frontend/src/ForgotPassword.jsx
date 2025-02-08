import { useNavigate } from 'react-router-dom';
import fetchNewAccessToken from "./utils";
import React, { useState } from 'react';
import { API_URL } from "./constants";
import './Validation.css';
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    
    const request = async () => {
      await axios.post(
        `${API_URL}/account/user/forgotpassword/`,
        {
          email: email,
        },
        {
        headers: {
            "Content-Type": "application/json",
        },
        }
      );
      navigate("/");
    };

    try {
      await request()
    } catch (error) {
      setError(error.response.data.detail)
      setLoading(false)
    } 
  };

  return (
    <div id="validation-container">
      
      <div id="validation-title-description">
          <div id="validation-title">Forgot your password?</div>
          <div id="validation-description">We will email you a temporary password.<br></br>
          Please change the password after login.</div>
      </div>
      <div id="validation">
        <form id="validation-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="validation-input"
            placeholder="University Email (@XX.edu)"
          />
          
            {error && <div id="login-error">{error}</div>}
          <button id="validation-button" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
