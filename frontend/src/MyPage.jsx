import React, { useState, useEffect } from "react";
import { API_URL } from "./constants";
import {GoogleConnectButton, fetchAPI} from "./utils";
import FeedArticleUI from "./FeedArticleUI";
import './Feed.css';
import './constants.css';

const MyPage = () => {
  const [articles, setArticles] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [sortOption, setSortOption] = useState("posted");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const color = localStorage.getItem('color');


  const apiEndpoints = {
    posted: `${API_URL}/community/article/posted_articles`,
    saved: `${API_URL}/community/article/saved_articles`,
    commented: `${API_URL}/community/article/commented_articles`,
    liked: `${API_URL}/community/article/liked_articles`,
  };


  useEffect(() => {
    fetchArticles();
  }, [sortOption]);


  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const fetchArticles = async () => {
    setLoading(true);
    const data = await fetchAPI(apiEndpoints[sortOption])
    if (data) {
      setArticles(data.results.articles);
      setNextArticlePage(data.next);
    }
    setLoading(false);
  };
  
  const fetchNextArticlePage = async () => {
    const scrollPosition = window.scrollY;
    setLoading(true);    
    const data = await fetchAPI(nextArticlePage)
    if (data) {
      setArticles((prev) => [...prev, ...data.results.articles]);
      setNextArticlePage(data.next);
    }
    window.scrollTo(0, scrollPosition);
    setLoading(false);
  };  

  const handleChangePassword = async () => {
    const url = `${API_URL}/account/user/newpassword/`;
    const data = await fetchAPI(url, {method: 'POST', body: {
      current_password: currentPassword,
      new_password: newPassword,
    }})
    if (data) {
      setError("Password changed successfully.");
      setErrorMsg();
      setCurrentPassword("");
      setNewPassword("");
    }

  };
  
  return (
    <div id="community-container">
      <div id="community-left"></div>
      <div id="community">

        {GoogleConnectButton()}
        
        <input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          id="email"
          type="password"
          placeholder='Current Password'
          className='login-email'
        />
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          id="email"
          type="password"
          placeholder='New Password'
          className='login-email'
        />
        <button
          id="grayButton"
          onClick={() => handleChangePassword()}
        >
          Change
        </button>
        {error && (
          <div id="error-msg">{error}</div>
        )}
        <div id="community-sort-options">
          <button
            id={sortOption === "posted" ? "active" : ""}
            onClick={() => handleSortChange("posted")}
            style={{
              backgroundColor:sortOption==="posted"
              ?color
              :'#fff',        
              color:sortOption==="posted"
              ?'#fff'
              :color 
            }}
          >
            Posted
          </button>
          <button
            id={sortOption === "saved" ? "active" : ""}
            onClick={() => handleSortChange("saved")}
            style={{
              backgroundColor:sortOption==="saved"
              ?color
              :'#fff',        
              color:sortOption==="saved"
              ?'#fff'
              :color          
            }}
          >
            Saved
          </button>
          <button
            id={sortOption === "commented" ? "active" : ""}
            onClick={() => handleSortChange("commented")}
            style={{
              backgroundColor:sortOption==="commented"
              ?color
              :'#fff',        
              color:sortOption==="commented"
              ?'#fff'
              :color        
            }}
          >
            Commented
          </button>
          <button
            id={sortOption === "liked" ? "active" : ""}
            onClick={() => handleSortChange("liked")}
            style={{
              backgroundColor:sortOption==="liked"
              ?color
              :'#fff',        
              color:sortOption==="liked"
              ?'#fff'
              :color        
            }}
          >
            Liked
          </button>
        </div>

        {(loading && articles.length == 0) ? (
          <p>Loading articles...</p>
        ) : (
          <div id="community-article-list">
            {articles.map((article) => (
              <FeedArticleUI key={article.id} {...article} />
            ))}
          </div>
        )}

        <div id="pagination">          
          {nextArticlePage && (
            <button
              onClick={() => fetchNextArticlePage()}
              // disabled={loadingMore}
              id="community-pagination-button"
              style={{color:color}}
            >
              + Load More Articles
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
