import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  
  const handleLogout = () => {
    localStorage.clear()
  };

  return (
    <nav id="navbar-container">
      <div id="navbar">
        
        <div id="logo">
          <h3 to="/">UNI.CON</h3>
        </div>

        
        <ul id="nav-links">
          <li><Link to="/">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
          <li><Link to="/community">Community</Link></li>
        </ul>

        
        <ul id="profile">
          <li><Link to="/" onClick={handleLogout}>Logout</Link></li>
          <li><Link to="/mypage">My Page</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
