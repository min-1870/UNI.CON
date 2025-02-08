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

    const request = async () => {
      const response = await axios.get(apiEndpoints[sortOption], {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setArticles(response.data.results.articles);
      setNextArticlePage(response.data.next);
    };

    try {
      await request();
    } catch (error) {
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await request();
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

    const request = async () => {
      const response = await axios.get(nextArticlePage, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setArticles((prev) => [...prev, ...response.data.results.articles]);
      setNextArticlePage(response.data.next);
    };

    try {
      await request();
    } catch (error) {
      try {
        accessToken = await fetchNewAccessToken(navigate);
        await request();
      } catch (error) {
        logout(navigate);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll event handler (debounced)
  const handleScroll = useCallback(() => {
    if (loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
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
                <div onClick={() => navigate(`/article/${article.id}`)}>
                  <div id="title">{article.title}</div>
                  <div id="community-article-info">
                    <div id="community-article-name-meta">
                      <div id="name">
                        {user === article.user
                          ? `${article.user_temp_name} (You)`
                          : article.user_temp_name}
                      </div>
                      <div id={article.unicon ? "unicon-meta" : "meta"}>
                        <div>{article.user_static_points}p</div>‧
                        <div>{new Date(article.created_at).toLocaleString()}</div>‧
                        <div className="view-container">{article.views_count}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loadingMore && <p>Loading more articles...</p>}

        {/* Display "Whoah! You've reached the end" when there's no next page */}
        {!nextArticlePage && !loadingMore && articles.length > 0 && (
          <div style={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "bold",
            color: color,
            marginTop: "20px",
            paddingBottom: "50px"
          }}>
            🏁 Whoah! You've reached the end of the feed 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;