import { useNavigate } from 'react-router-dom';
import fetchNewAccessToken from "./utils";
import React, { useState } from 'react';
import { API_URL } from "./constants";
import './Validation.css';

import axios from "axios";
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
    
    try {
      await axios.post(
          `${API_URL}/account/user/validate/`,
          {
            validation_code: validationCode,
          },
          {
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
          },
          }
      );
      localStorage.setItem('is_validated', true);
      navigate("/feed");
    
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try{
          await fetchNewAccessToken(navigate);        
          const response = await axios.post(
              `${API_URL}/account/user/validate/`,
              {
                validation_code: validationCode,
              },
              {
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem('access')}`,
              },
              }
          );
          console.log(response)
          
            localStorage.setItem('is_validated', response.data.is_validated);
            navigate("/community");
        }catch(error){
          
          setError(error.response.data.detail)
          setLoading(false)
        }
        
        
        
      } else {
        setError(error.response.data.detail)
        setLoading(false)
      }

    }
  };

  return (
    <div id="validation-container">
      
      <div id="validation-title-description">
          <div id="validation-title">verify your email address!</div>
          <div id="validation-description">We emailed you a six-digit code to your email.<br></br>
          Enter the code below to confirm your email address.</div>
      </div>
      <div id="validation">
        <form id="validation-form" onSubmit={handleSubmit}>
          <label>Code</label>
          <input
            type="text"
            value={validationCode}
            onChange={(e) => setValidationCode(e.target.value)}
            id="validation-input"
            placeholder="a 6-digit number"
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

export default Validation;
