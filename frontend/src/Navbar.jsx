import { useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [search, setSearch] = useState('');
  const is_validated = JSON.parse(localStorage.getItem('is_validated')) || false;
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
    navigate("/postarticle");
  };

  const handleSearch = () => {
    navigate(`/searchresults?search_content=${search}`);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  };

  return (
    <>
    {(is_validated) && (
    <nav id="navbar-container">
      
        <div id="navbar">
                
        <div id="navbar-logo" onClick={() => {navigate(`/community/`);setSearch("");}}>
          <div id="navbar-title">UNI.CON</div>
          <div id="navbar-initial" style={{color:color}}>{initial.toUpperCase()}</div>
        </div>
        
        <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              id="navbar-search"
              placeholder='Search anything here'
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
