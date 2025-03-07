import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {fetchNewAccessToken, logout} from "./utils";
import { API_URL } from "./constants";
import axios from "axios";
import './Feed.css';
import './constants.css';

const SearchResults = () => {
  const [articles, setArticles] = useState([]);
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [loading, setLoading] = useState(false);
  let accessToken = localStorage.getItem('access');
  const color = localStorage.getItem('color');
  const user = localStorage.getItem('user');
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const search_content = queryParams.get('search_content');


  useEffect(() => {
    fetchArticles();
  }, [search_content]);


  const fetchArticles = async () => {
    setLoading(true);
    
    const request = async () => {
      const response = await axios.get(`${API_URL}/community/article/search?search_content=${search_content}`, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      setArticles(response.data.results.articles);
      setNextArticlePage(response.data.next);
    };

    try {
      await request()
    } catch (error) {
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await request();
      } catch (error) {
        logout(navigate);
      }
    } finally {
      setLoading(false);
    };

  };
  

  const fetchNextArticlePage = async () => {
    const scrollPosition = window.scrollY;
    setLoading(true);
    
    const request = async () => {
      const response = await axios.get(nextArticlePage,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );
      setArticles((prev) => [...prev, ...response.data.results.articles]);
      setNextArticlePage(response.data.next);
    };

    try {
      await request()
    } catch (error) {
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await request();
      } catch (error) {
        logout(navigate);
      }
    } finally {
      window.scrollTo(0, scrollPosition);
      setLoading(false);
    };

  };  


  const handleLike = async (article_id) => {
    const article = articles.find((article) => article.id === article_id);
    
    const request = async () => {
      const url = article.like_status
        ? `${API_URL}/community/article/${article_id}/unlike/`
        : `${API_URL}/community/article/${article_id}/like/`;

      await axios.post(url, {}, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setArticles((prevArticles) =>
        prevArticles.map(article =>
          article.id === article_id ? { ...article,
              like_status: !article.like_status,
              likes_count: article.like_status ? article.likes_count - 1 : article.likes_count + 1,
          } : article 
        )
      );
    }

    try {
      await request()
    } catch (error) {
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await request();
      } catch (error) {
        logout(navigate);
      }
    } finally {
    };

  };

  
  const handleSave = async (article_id) => {
    const article = articles.find((article) => article.id === article_id);
    
    const request = async () => {
      const url = article.save_status
        ? `${API_URL}/community/article/${article_id}/unsave/`
        : `${API_URL}/community/article/${article_id}/save/`;

      await axios.post(url, {}, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setArticles((prevArticles) =>
        prevArticles.map(article =>
          article.id === article_id ? { ...article,
              save_status: !article.save_status,
          } : article 
        )
      );
    }

    try {
      await request()
    } catch (error) {
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await request();
      } catch (error) {
        logout(navigate);
      }
    } finally {
    };
    
  };


  return (
    <div id="community-container">
      <div id="community-left"></div>
      <div id="community">

        {(loading && articles.length == 0) ? (
          <p>Loading articles...</p>
        ) : (
          <div id="community-article-list">
            {articles.map((article) => (
              <div 
              id={article.unicon ? article.view_status ? "community-article-unicon-viewed": "community-article-unicon": article.view_status ?"community-article-viewed":"community-article"}
                key={article.id}
              >
                <div  onClick={() => navigate(`/article/${article.id}`)}>
                <div id="title">{article.title}</div>
                <div id="community-article-info">
                  <div id="community-article-name-meta">
                    {user == article.user ? (
                      <div id="name"> {article.user_temp_name} (You)</div>
                    ):(
                      <div id="name"> {article.user_temp_name}</div>
                    )}
                    
                    <div id={article.unicon ? "unicon-meta" : "meta"}>
                      <div>{article.user_static_points}p</div>‧
                      <div> {new Date(article.created_at).toLocaleString()}</div>‧
                      
                      <div className="view-container"> 
                        {article.unicon?(
                          <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
                        ):(
                          <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="20px" fill="#A0AEC0"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
                        )}
                        {article.views_count}
                      </div>
                    </div>
                  </div>
                  {article.unicon &&(
                    <div id="community-article-unicon-initial">{article.user_school.toUpperCase()}</div>
                  )}
                </div>
                <hr id="line"></hr>
                <div id="body" >{article.body}</div>
                {article.course_code.length != 0 && (
                  <div id="courses">
                    {article.course_code.split(",").map((course, index) => (
                      
                      <button
                          id="emptyGrayButton"
                          key={index}
                          disabled={true}
                        >
                          {course}
                      </button>

                    ))}
                  </div>
                )}
                </div>
                {(!article.deleted && article.edited) &&(
                  <div id={article.unicon ? "unicon-edited" : "edited"}>edited</div>
                )}
                <div id="community-article-buttons">
                  <button onClick={() => 
                    handleLike(article.id)}
                    id={article.like_status ? "like" : "unlike"}
                    >
                    <svg  className="like-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                    {article.likes_count}
                  </button>
                  <button 
                    onClick={() => navigate(`/article/${article.id}`)}
                    id="comment"
                    >
                    <svg   className="comment-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>
                    {article.comments_count}
                  </button>
                  <button 
                    onClick={() => handleSave(article.id)}
                    id="save"
                    >
                    {article.save_status?
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2d3748"><path d="M713-600 600-713l56-57 57 57 141-142 57 57-198 198ZM200-120v-640q0-33 23.5-56.5T280-840h240v80H280v518l200-86 200 86v-278h80v400L480-240 200-120Zm80-640h240-240Z"/></svg>
                    :<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2d3748"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>
                    }
                  </button>
                </div>
              </div>
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

export default SearchResults;
