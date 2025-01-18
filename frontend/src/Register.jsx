import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNavigateToLogin = () => {
    navigate("/");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    
  };

  return (
    <div className="auth-container">
      <video autoPlay muted loop className="background-video">
        <source src="/BACKGROUND.mp4" type="video/mp4" />
      </video>
      <div className="auth-content" id="register-content">
        <div className="auth-title">Welcome</div>
        <div className="auth-description">
          Sign up quickly and easily to unlock all features
        </div>
        <form onSubmit={handleRegister} className="auth-form">
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
            {loading ? "SIGNING UP..." : "SIGN UP"}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account?{" "}
          <span onClick={handleNavigateToLogin}>Sign In</span>
        </div>
      </div>
      {/* UNI.CON Logo */}
      <div className="auth-logo">UNI.CON</div>
    </div>
  );
};

export default Register;