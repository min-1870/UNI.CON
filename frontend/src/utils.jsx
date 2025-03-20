import { API_URL } from "./constants";
import axios from "axios";
import { useEffect, useState } from "react";


const fetchNewAccessToken = async (navigate) => {
    
    const refreshToken = localStorage.getItem('refresh');
    const url = `${API_URL}/account/token/refresh`

    try {
        const response = await axios.post(
            url,
            {
            refresh: refreshToken,
            },
            {
            headers: {
                "Content-Type": "application/json",
            },
            }
        );
        localStorage.setItem('access', response.data.access);
        return response.data.access
    } catch (error) {
        logout(navigate);
    }
};
  
  
const logout = async (navigate) => {
    localStorage.clear()
    navigate("/")
    window.location.reload();
};
  
const fetchAPI = async (url, {token = true, method = "GET", body = {}} = {}) => {

  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${localStorage.getItem("access")}` })
  };

  const request = async () => {
    try {
      const response = await axios({
        method,
        url,
        headers,
        ...(method !== "GET" && { data: body }) // Only add body for non-GET requests
      });
      return response.data;
    } catch (error) {
      throw error; // Throw to be caught in the outer try-catch
    }
  };
  try {
    return await request();
  } catch (error) {
    try {
      accessToken = await fetchNewAccessToken(navigate);
      return await request();
    } catch (error) {
      return false
    }
  };
};


const GOOGLE_CLIENT_ID = '654153127818-9aao6il7d5vv3ivdb27nlsa58s7i6knl.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:8000/api/account/user/googlelink/';

const GoogleLoginButton = () => {

  const handleButtonClick = async () => {
    try {
      // Redirect the user to the Google Auth URL after fetching the state token
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        'http://localhost:8000/api/account/user/googlelogin/'
      )}&response_type=code&scope=${encodeURIComponent("profile email")}&state=${"state"}`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Error fetching state token:", error);
    }
  };

  return (
    <button onClick={handleButtonClick}>Login with Google</button>
  );
};

const GoogleConnectButton = () => {

  const handleButtonClick = async () => {
    try {
      const token = await axios.get("http://localhost:8000/api/account/user/google_auth_session/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }).data.state;
      
      // Redirect the user to the Google Auth URL after fetching the state token
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${encodeURIComponent("profile email")}&state=${token}`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Error fetching state token:", error);
    }
  };

  return (
    <button onClick={handleButtonClick}>Connect with Google</button>
  );
};



export default fetchNewAccessToken;
export { fetchNewAccessToken, logout ,GoogleConnectButton, GoogleLoginButton, fetchAPI };