import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Navbar.css';

const Navbar = () => {
  const [search, setSearch] = useState('');
  const accessToken = localStorage.getItem('access') || null;
  const initial = localStorage.getItem('initial') || '';
  const color = localStorage.getItem('color') || '#000';
  const points = localStorage.getItem('points');
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.clear()
    navigate("/")
    window.location.reload();
  }; 

  const handleWrite = () => {    
    navigate("/postarticle")
  };

  return (
    <>
    {accessToken && (
    <nav id="navbar-container">
      
        <div id="navbar">
                
        <div id="navbar-logo">
          <div id="navbar-title">UNI.CON</div>
          <div id="navbar-initial" style={{color:color}}>{initial.toUpperCase()}</div>
        </div>
        
        <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="navbar-search"
              placeholder='Search Keywords     - Sorry.. We are still working on this feature :/'
        />


          <button 
            onClick={handleWrite}
            id="navbar-logout"
            >
            Write
          </button>
          
          <button 
            onClick={handleLogout}
            id="navbar-logout"
            >
            Logout
          </button>
          <div id="navbar-points">{points}p</div>
        </div>
      
    </nav>
    )} 
    </>
  );
}

export default Navbar;
