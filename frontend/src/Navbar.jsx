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
                
        <div id="navbar-logo" onClick={() => {navigate(`/feed/`);setSearch("");}}>
        
        <div id = "navbar-logo-container">
          <div id="navbar-initial" style={{color:color}}>{initial.toUpperCase()}</div>
          {/* <img src="/poweredby copy.png" alt="logo" id="navbar-logo-img"/> */}
         </div>
          
      
        </div>
        
        <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              id="navbar-search"
              placeholder='Search anything here'
        />

          <div id = "navbar-buttons"> 
            <button 
            onClick={() => navigate("/postarticle")}
            id="navbar-logout"
            >
            Write
          </button>

          <button 
            onClick={() => navigate("/mypage")}
            id="navbar-logout"
            >
            My Page
          </button>
          
          <button 
            onClick={handleLogout}
            id="navbar-logout"
            >
            Logout
          </button>
          <div id="navbar-points">{points}p</div>
          </div> 
          
        </div>
      
    </nav>
    )} 
    </>
  );
}

export default Navbar;
