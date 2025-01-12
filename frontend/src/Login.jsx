import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => {
    setIsLogin((prev) => !prev); // Toggle between login and register
    setError(""); // Clear errors when switching
    setEmail(""); // Reset input fields
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill out both fields.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin
        ? "/account/user/login/"
        : "/account/user/"; 

      // Create a minimum delay of 2 seconds
      const delay = new Promise((resolve) => setTimeout(resolve, 1000));

      const response = fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const [delayedResponse, result] = await Promise.all([delay, response]);

      if (result.ok) {
        const data = await result.json();
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        if (isLogin) {
          navigate(data.is_validated ? "/community" : "/validation");
        } else {
          navigate("/validation");
        }
      } else {
        const errorMsg =
          result.status === 401
            ? "Incorrect email or password."
            : "An unexpected error occurred. Please try again.";
        setError(errorMsg);
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Loader and button text logic
  const buttonContent = loading ? (
    <div className="loader"></div>
  ) : isLogin ? (
    "Sign In"
  ) : (
    "Sign Up"
  );

  return (
    <div className="auth-container">
      {/* Persistent Background Video */}
      <video autoPlay muted loop className="background-video">
        <source src="/BACKGROUND.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      {/* Content */}
      <div className="auth-content">
        <div className="auth-title">{isLogin ? "Welcome Back" : "Welcome"}</div>
        <div className="auth-description">
          {isLogin
            ? "Enter your email and password to sign in."
            : "Sign up quickly and easily to unlock all features."}
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">University Email</label>
          <input
            type="email"
            id="email"
            value={email}
            placeholder="Your University Email (@XX.edu)"
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            placeholder="Your Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {buttonContent}
          </button>
        </form>
        <div className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <span onClick={handleToggle}>
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </div>
      </div>

      {/* Persistent UNI.CON Logo */}
      <div className="auth-logo">UNI.CON 🎓</div>
    </div>
  );
};

export default Auth;