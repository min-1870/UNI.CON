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
        {/* Logo */}
        <div id="logo">
          <Link to="/">UNI.CON</Link>
        </div>

        {/* Navigation Links */}
        <ul id="nav-links">
          <li><Link to="/">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>

        {/* Profile/Account Section */}
        <div id="profile">
          <Link to="/" onClick={handleLogout}>Logout</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
