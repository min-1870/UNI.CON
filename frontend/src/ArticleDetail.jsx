import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [nextCommentPage, setNextCommentPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const accessToken = localStorage.getItem("access");
  const user = localStorage.getItem('user');
  useEffect(() => {
    fetchArticleDetails();
  }, [articleId]);

  const fetchArticleDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/community/article/${articleId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      const { article, comments } = response.data.results;
      setArticle(article);
      setComments(comments);
      setNextCommentPage(response.data.next);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching article details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextCommentPage = async () => {
    setLoadingMore(true);
    try {
      const response = await axios.get(
        nextCommentPage, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
      });
      const filteredComments = response.data.results.comments.filter(
        (comment) => !comments.some((localComment) => localComment.id === comment.id)
      );
      setComments((prev) => [...prev, ...filteredComments]);
      setNextCommentPage(response.data.next);
    } catch (error) {
      console.error("Error loading more comments:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNewCommentSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
        console.log(newComment)
        console.log(articleId)
        const response = await axios.post(
            `http://127.0.0.1:8000/community/comment/`,
            {
            body: newComment,
            article: articleId,
            },
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            }
        );
        console.log(response)
        if (response.status == 201){
            setComments((prevComments) => [
                {
                ...response.data,
                body: response.data.body,
                user_temp_name: response.data.user_temp_name,
                user_static_points: response.data.user_static_points,
                user_school: response.data.user_school,
                like_status: response.data.like_status,
                },
                ...prevComments,
            ]);
        }
        setNewComment(""); 
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId, currentLikeStatus, index) => {
    const url = `http://127.0.0.1:8000/community/comment/${commentId}/`
    try {
        const response = await axios.delete(
            url,
            {},
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            }
        );
        if (response.status == 204){
            setComments((prevComments) =>
              prevComments.map(comment =>
                comment.id === commentId ? { ...comment,
                    deleted: true,
                    body: "[DELETED CONTENT]"
                } : comment
              )
            );
        }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };
  
  const toggleArticleLike = async () => {
    if (!article) return;

    const endpoint = article.like_status
      ? `http://127.0.0.1:8000/community/article/${article.id}/unlike/`
      : `http://127.0.0.1:8000/community/article/${article.id}/like/`;
    try {
      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );
      if (response.status == 200){
        setArticle((prevArticle) => ({
            ...prevArticle,
            like_status: !prevArticle.like_status,
            likes_count: prevArticle.like_status
              ? prevArticle.likes_count - 1
              : prevArticle.likes_count + 1,
        }));
      }
    } catch (error) {
      console.error("Error toggling article like:", error);
    }
  };

  const toggleCommentLike = async (commentId, currentLikeStatus, index) => {
    const endpoint = currentLikeStatus
      ? `http://127.0.0.1:8000/community/comment/${commentId}/unlike/`
      : `http://127.0.0.1:8000/community/comment/${commentId}/like/`;
    try {
        const response = await axios.post(
            endpoint,
            {},
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            }
        );
        if (response.status == 201){
            setComments((prevComments) =>
            prevComments.map((comment, i) =>
            i === index
                ? {
                    ...comment,
                    like_status: !currentLikeStatus,
                    likes_count: currentLikeStatus
                    ? comment.likes_count - 1
                    : comment.likes_count + 1,
                }
                : comment
        ));}
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  if (loading) return <p>Loading article...</p>;

  return (
    <div id="article-detail-container">
      {article && (
        <>
          <h1>{article.title}</h1>
          <p>{article.body}</p>
          <div id="article-stats">
            <span><strong>Views:</strong> {article.views_count}</span>
            <span><strong>Comments:</strong> {article.comments_count}</span>
            <span><strong>Likes:</strong> {article.likes_count}</span>
            <button
              onClick={toggleArticleLike}
              className={article.like_status ? "liked" : "unliked"}
            >
              {article.like_status ? "Unlike" : "Like"}
            </button>
          </div>
        </>
      )}

      <div id="comments-section">
        <h2>Comments</h2>

        <div id="new-comment">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            disabled={submittingComment}
          />
          <button onClick={handleNewCommentSubmit} disabled={submittingComment}>
            {submittingComment ? "Submitting..." : "Submit"}
          </button>
        </div>

        {comments.map((comment, index) => (
          <div key={comment.id} className="comment">
            <p>{comment.body}</p>
            <div className="comment-meta">
              <span><strong>By:</strong> {comment.user_temp_name}</span>
              <span><strong>Points:</strong> {comment.user_static_points}</span>
              <span><strong>From:</strong> {comment.user_school}</span>
              <span><strong>Date & Time:</strong> {new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <div className="comment-actions">
                {!comment.deleted && (
                    <button
                        onClick={() => toggleCommentLike(comment.id, comment.like_status, index)}
                        className={comment.like_status ? "liked" : "unliked"}
                    >
                        {comment.like_status ? "Unlike" : "Like"} ({comment.likes_count})
                    </button>
                )}
              {(comment.user == user && !comment.deleted) && (
                <button
                onClick={() => handleCommentDelete(comment.id, comment.like_status, index)}
                disabled={loadingMore}
                className="pagination-button"
                >
                Delete
                </button>
              )}
            </div>
          </div>
        ))}

        <div id="pagination-controls">
          {nextCommentPage && (
            <button
              onClick={() => fetchNextCommentPage(nextCommentPage)}
              disabled={loadingMore}
              className="pagination-button"
            >
              Load More Comments
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;