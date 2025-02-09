import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./constants";
import { fetchNewAccessToken, logout } from "./utils";
import axios from "axios";
import './Feed.css';
import './constants.css';

const Feed = () => {
  const [articles, setArticles] = useState([]);
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [sortOption, setSortOption] = useState("recent");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  let accessToken = localStorage.getItem("access");
  const color = localStorage.getItem("color");
  const user = localStorage.getItem("user");
  const navigate = useNavigate();

  const apiEndpoints = {
    recent: `${API_URL}/community/article`,
    hot: `${API_URL}/community/article/hot`,
    preference: `${API_URL}/community/article/preference`,
  };

  useEffect(() => {
    fetchArticles();
  }, [sortOption]);

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching articles from:", apiEndpoints[sortOption]);

      const response = await axios.get(apiEndpoints[sortOption], {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Fetched Articles:", response.data.results.articles);
      setArticles(response.data.results.articles);
      setNextArticlePage(response.data.next);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setError("Failed to load articles. Please try again.");
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await fetchArticles();
      } catch (error) {
        logout(navigate);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNextArticlePage = async () => {
    if (!nextArticlePage || loadingMore) return;
    setLoadingMore(true);

    try {
      console.log("Fetching more articles from:", nextArticlePage);

      const response = await axios.get(nextArticlePage, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("New Articles Loaded:", response.data.results.articles);
      setArticles((prev) => [...prev, ...response.data.results.articles]);
      setNextArticlePage(response.data.next);
    } catch (error) {
      console.error("Error fetching more articles:", error);
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await fetchNextArticlePage();
      } catch (error) {
        logout(navigate);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      console.log("Triggering fetchNextArticlePage...");
      fetchNextArticlePage();
    }
  }, [loadingMore, nextArticlePage]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div id="community-container">
      <div id="community-left"></div>
      <div id="community">
        <div id="community-sort-options">
          {["recent", "hot", "preference"].map((option) => (
            <button
              key={option}
              id={sortOption === option ? "active" : ""}
              onClick={() => handleSortChange(option)}
              style={{
                backgroundColor: sortOption === option ? color : "#fff",
                color: sortOption === option ? "#fff" : color,
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        {loading && articles.length === 0 ? (
          <p>Loading articles...</p>
        ) : (
          <div id="community-article-list">
            {articles.map((article) => (
              <div
                id={
                  article.unicon
                    ? article.view_status
                      ? "community-article-unicon-viewed"
                      : "community-article-unicon"
                    : article.view_status
                    ? "community-article-viewed"
                    : "community-article"
                }
                key={article.id}
              >
                <div
                  className="community-article-clickable"
                  onClick={() => navigate(`/article/${article.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div id="community-article-title">{article.title}
                  <div id="community-article-name-meta">
                      <div id="name">
                        ✍️ 
                        {user === article.user
                          ? ` ${article.user_temp_name} (You)`
                          :  article.user_temp_name}
                      </div>
                      <div id={article.unicon ? "unicon-meta" : "meta"}>
                        <div>{article.user_static_points}p</div>‧
                        <div>{new Date(article.created_at).toLocaleString()}</div>‧
                        👀
                        <div className="view-container">{article.views_count}</div>
                      </div>
                    </div>
                  
                  </div>
                  <hr id="community-article-separator" />
                  <div id="community-article-info">
              
                  </div>

                  {/* Display article content preview */}
                  <div id="community-article-preview">
                    {article.body.length > 200
                      ? `${article.body.substring(0, 200)}...`
                      : article.body}
                  </div>
                </div>

                {/* Like, Comment, Save Buttons */}
                <div id="community-article-buttons">
                  <button onClick={() => handleLike(article.id)} id={article.like_status ? "like" : "unlike"}>
                    👍 {article.likes_count}
                  </button>

                  <button onClick={() => navigate(`/article/${article.id}`)} id="comment">
                    💬 {article.comments_count}
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

        {loadingMore && <p>Loading more articles...</p>}

        {!nextArticlePage && !loadingMore && articles.length > 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: color,
              marginTop: "20px",
              paddingBottom: "50px",
            }}
          >
            🏁 Whoah! You've reached the end of the feed 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;