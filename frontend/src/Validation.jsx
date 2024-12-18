import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { API_URL } from "./constants";
import './Validation.css';

const Validation = () => {
  const [validationCode, setValidationCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const accessToken = localStorage.getItem('access');
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    const response = await fetch(`${API_URL}/account/user/validate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        validation_code: validationCode,
      }),
    });

    if (response.status === 200) {
      navigate("/community");
    } else {
      const data = await response.json();
      setError(data.detail || 'Validation failed');
    }
  };

  return (
    <div id="validation-container">
      <div id="validation">
      <h2>Enter Validation Code</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="6-digit code"
          value={validationCode}
          onChange={(e) => setValidationCode(e.target.value)}
          id="validation-input"
        />
          {error && <p id="login-error">{error}</p>}
        <button id="validation-container" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default Validation;
