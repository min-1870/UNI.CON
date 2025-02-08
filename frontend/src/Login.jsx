import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { API_URL } from "./constants";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to toggle between Login and Register
  const handleToggle = () => {
    setIsLogin((prev) => !prev);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword(""); // Reset confirmPassword when switching
  };

  // Function to sign in as a random demo user
  const signInRandomUser = () => {
    const demo_users = [
      { email: "root@unsw.edu.au", password: "rootroot" },
      { email: "root@sydney.edu.au", password: "rootroot" },
      { email: "root@unimelb.edu.au", password: "rootroot" },
      { email: "root@uts.edu.au", password: "rootroot" },
      { email: "root@rmit.edu.au", password: "rootroot" },
    ];
    const randomUser = demo_users[Math.floor(Math.random() * demo_users.length)];
    setEmail(randomUser.email);
    setPassword(randomUser.password);
  };

  // Function to handle form submission (Login/Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill out both fields.");
      setLoading(false);
      return;
    }

    // Password confirmation validation for sign-up
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin
        ? `${API_URL}/account/user/login/`
        : `${API_URL}/account/user/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("user", data.id);
        localStorage.setItem("color", data.color);
        localStorage.setItem("initial", data.initial);
        localStorage.setItem("points", data.points);
        localStorage.setItem("is_validated", data.is_validated);

        if (isLogin) {
          navigate(data.is_validated ? "/community" : "/validation");
        } else {
          navigate("/validation");
        }
      } else if (response.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Show Confirm Password only for Registration */}
          {!isLogin && (
            <>
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                placeholder="Confirm Your Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? (isLogin ? "Signing In..." : "Signing Up...") : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {/* Debug Mode: Sign in as a random user */}
        {isLogin && (
          <button className="debug-button" onClick={signInRandomUser} disabled={loading}>
            DEBUG MODE: Sign in as a random user
          </button>
        )}

        {/* Switch between Login and Register */}
        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={handleToggle}>{isLogin ? "Sign Up" : "Sign In"}</span>
        </div>
      </div>

      {/* Persistent UNI.CON Logo */}
      <div className="auth-logos">
        <div className="auth-logo">
          <img src="/UNICON.png" alt="UNI.CON Logo" />
        </div>
        <div className="auth-slogan">
          <img src="/Slogan2.png" alt="UNI.CON Slogan" />
        </div>
      </div>
    </div>
  );
};

export default Auth;