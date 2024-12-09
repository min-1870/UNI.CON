import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Community.css';

const Community = () => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState("recent");
  const [loading, setLoading] = useState(false);
  const accessToken = localStorage.getItem('access');
  const navigate = useNavigate();

  const apiEndpoints = {
    recent: "http://127.0.0.1:8000/community/article",
    hot: "http://127.0.0.1:8000/community/article/hot",
    preference: "http://127.0.0.1:8000/community/article/preference",
  };

  useEffect(() => {
    fetchArticles();
  }, [page, sortOption]);

  const fetchArticles = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(apiEndpoints[sortOption], {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${accessToken}`,
        },
        params: { page },
      });
      console.log(response);
      const { results, count } = response.data;
      setArticles(results.articles);
      setTotalPages(Math.ceil(count / 10));
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setPage(1); 
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && page < totalPages) {
      setPage(page + 1);
    } else if (direction === "prev" && page > 1) {
      setPage(page - 1);
    }
  };

  const handleLike = async (articleId) => {
    const article = articles.find((a) => a.id === articleId);
    if (article) {
      try {
        const url = article.like_status
          ? `http://127.0.0.1:8000/community/article/${articleId}/unlike/`
          : `http://127.0.0.1:8000/community/article/${articleId}/like/`;

        await axios.post(url, {}, {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        article.like_status = !article.like_status;
        article.likes_count = article.like_status
          ? article.likes_count + 1
          : article.likes_count - 1;

        setArticles([...articles]);
      } catch (error) {
        console.error("Error toggling like status:", error);
      }
    }
  };

  return (
    <div id="container">
      <div id="community">
        <h1>Community Articles</h1>
        <div id="sort-options">
          <button
            id={sortOption === "recent" ? "active" : ""}
            onClick={() => handleSortChange("recent")}
          >
            Recent
          </button>
          <button
            id={sortOption === "hot" ? "active" : ""}
            onClick={() => handleSortChange("hot")}
          >
            Hot
          </button>
          <button
            id={sortOption === "preference" ? "active" : ""}
            onClick={() => handleSortChange("preference")}
          >
            Preference
          </button>
        </div>

        {loading ? (
          <p>Loading articles...</p>
        ) : (
          <div id="article-list">
            {articles.map((article) => (
              <div id="article" key={article.id} onClick={() => navigate(`/article/${article.id}`)}>
                <h2>{article.title}</h2>
                <p>{article.body}</p>
                <div id="article-meta">
                  <span><strong>By: </strong> {article.user_temp_name}</span>
                  <span><strong>Points: </strong> {article.user_static_points}</span>
                  <span><strong>From: </strong> {article.user_school}</span>
                  <span><strong>Date: </strong> {new Date(article.created_at).toLocaleString()}</span>
                  <span><strong>Unicon: </strong> {article.unicon ? "Yes" : "No"}</span>
                </div>
                <div id="article-stats">
                  <span><strong>Views: </strong> {article.views_count}</span>
                  <span><strong>Comments: </strong> {article.comments_count}</span>
                  <span><strong>Likes: </strong> {article.likes_count}</span>
                </div>
                <div id="like-button">
                  <button onClick={() => 
                    handleLike(article.id)}
                    className={article.like_status ? "liked" : "unliked"}
                    >
                    {article.like_status ? "Unlike" : "Like"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div id="pagination">
          <button onClick={() => handlePageChange("prev")} disabled={page === 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange("next")}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Community;
