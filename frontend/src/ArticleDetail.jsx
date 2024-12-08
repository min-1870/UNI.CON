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

  useEffect(() => {
    console.log("Updated comments:", comments);
  }, [comments]);

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

  const handleCommentDelete = async (comment_id) => {
    const url = `http://127.0.0.1:8000/community/comment/${comment_id}/`
    try {
        const response = await axios.delete(
            url,
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
                comment.id === comment_id ? { ...comment,
                    deleted: true,
                    body: "[DELETED CONTENT]"
                } : comment
              )
            );
        }
    } catch (error) {
      console.error("Error delete comment:", error);
    }
  };

  const handleCommentEdit = async (comment_id) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
            ? {
                ...comment,
                editing: true,
                text_area: comment.body
            }
            : comment
    ));
  };

  const handleCommentCancel = async (comment_id) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
          ? {
              ...comment,
              editing: false,
              text_area: ''
          }
          : comment
    ));
  };
  

  const handleCommentReplyCancel = async (comment_id) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
          ? {
              ...comment,
              replying: false,
              reply_text_area: ''
          }
          : comment
    ));
  };
  
  const handleCommentReply = async (comment_id) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
          ? {
              ...comment,
              replying: true,
              child_text_area: ''
          }
          : comment
    ));
  };

  const handleCommentReplyTextArea = async (comment_id, value) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
          ? {
              ...comment,
              reply_text_area: value
          }
          : comment
    ));
  };
  
  const handleCommentReplySave = async (comment_id, value) => {
    const url = `http://127.0.0.1:8000/community/comment/`
    console.log(comment_id, value)
    try {
        const response = await axios.post(
            url,
            {
              "body": value,
              "article": articleId,
              "parent_comment": comment_id
            },
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
            }
        );
        
        // if (response.status == 200){
        //     setComments((prevComments) =>
        //       prevComments.map(comment =>
        //         comment.id === comment_id ? { ...comment,
        //             editing: false,
        //             text_area: '',
        //             body: text_area
        //         } : comment
        //       )
        //     );
        // }
    } catch (error) {
      console.error("Error edit comment:", error);
    }
  };

  const handleCommentTextArea = async (comment_id, value) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
          ? {
              ...comment,
              text_area: value
          }
          : comment
    ));
  };
  
  const handleCommentSave = async (comment_id, text_area) => {
    const url = `http://127.0.0.1:8000/community/comment/${comment_id}/`
    try {
        const response = await axios.patch(
            url,
            {
              "body": text_area
            },
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
            }
        );
        
        if (response.status == 200){
            setComments((prevComments) =>
              prevComments.map(comment =>
                comment.id === comment_id ? { ...comment,
                    editing: false,
                    text_area: '',
                    body: text_area
                } : comment
              )
            );
        }
    } catch (error) {
      console.error("Error edit comment:", error);
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
      <div id="article-detail">


        <div id="article-detail-article">
          {article && (
            <>
              <h1>{article.title}</h1>
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
                <button
                  onClick={toggleArticleLike}
                  className={article.like_status ? "liked" : "unliked"}
                >
                  {article.like_status ? "Unlike" : "Like"}
                </button>
              </div>
            </>
          )}
        </div>


        <div id="article-detail-new-comments">
          <textarea
            value={newComment}
            id="article-detail-comment-textarea"
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            disabled={submittingComment}
          />
          <button onClick={handleNewCommentSubmit} disabled={submittingComment}>
            {submittingComment ? "Submitting..." : "Submit"}
          </button>
        </div>


        <div id="article-detail-comments">
          {comments.map((comment, index) => (
            <div key={comment.id} id="article-detail-comment">
              {comment.editing ? (
                  <textarea
                    value={comment.text_area}
                    id="article-detail-comment-textarea"
                    onChange={(e) => handleCommentTextArea(comment.id, e.target.value)}
                    placeholder="Write your comment here..."
                    disabled={submittingComment}
                  />
                ) : (
                  <p>{comment.body}</p>
                )
              }
              <div id="article-detail-comment-meta">
                <span><strong>By: </strong> {comment.user_temp_name}</span>
                <span><strong>Points: </strong> {comment.user_static_points}</span>
                <span><strong>From: </strong> {comment.user_school}</span>
                <span><strong>Date: </strong> {new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <div id="article-detail-comment-actions">
                  {!comment.deleted && (
                    <>
                      <button
                            onClick={() => toggleCommentLike(comment.id, comment.like_status, index)}
                            className={comment.like_status ? "liked" : "unliked"}
                        >
                            {comment.like_status ? "Unlike" : "Like"} ({comment.likes_count})
                        </button>
                        <button
                            onClick={() => handleCommentReply(comment.id)}
                        >
                        Reply
                        </button>
                      </>
                  )}
                  {(comment.user == user && !comment.deleted) && (
                    <>
                      { comment.editing ? (
                        <>
                          <button
                          onClick={() => handleCommentCancel(comment.id)}
                          disabled={loadingMore}
                          >
                          Cancel
                          </button>
                          <button
                          onClick={() => handleCommentSave(comment.id, comment.text_area)}
                          disabled={loadingMore}
                          >
                          Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                          onClick={() => handleCommentEdit(comment.id)}
                          disabled={loadingMore}
                          >
                          Edit
                          </button>
                          <button
                          onClick={() => handleCommentDelete(comment.id)}
                          disabled={loadingMore}
                          >
                          Delete
                          </button>
                        </>
                      )}
                    </>
                  )}
              </div>
              {comment.replying && (
                  <>
                    <textarea
                      value={comment.reply_text_area}
                      id="article-detail-comment-textarea"
                      onChange={(e) => handleCommentReplyTextArea(comment.id, e.target.value)}
                      placeholder="Write your comment here..."
                      disabled={submittingComment}
                    />
                    <div id="article-detail-comment-actions">
                      <button
                        onClick={() => handleCommentReplyCancel(comment.id)}
                        disabled={loadingMore}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCommentReplySave(comment.id, comment.reply_text_area)}
                        disabled={loadingMore}
                      >
                        Post
                      </button>
                    </div>
                  </>
                )
              }
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
    </div>
  );
};

export default ArticleDetail;