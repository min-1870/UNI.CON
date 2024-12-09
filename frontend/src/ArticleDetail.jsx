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
  
  const fetchNextNestedCommentPage = async (comment_id) => {
    setLoadingMore(true);
    const comment = comments.find((comment) => comment.id === comment_id)
    try {
      const response = await axios.get(
        comment.next_comment_page, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
      });

      if (response.status == 200) {
        const filteredComments = response.data.results.nested_comments.filter(
          (nested_comment) => !comment.nested_comments.some((localComment) => localComment.id === nested_comment.id)
        );      
        setComments((prevComments) =>
          prevComments.map(comment =>
            comment.id === comment_id ? { ...comment,
                nested_comments: [...comment.nested_comments, ...filteredComments],
                show_nested_comments: true,
                next_comment_page: response.data.next
            } : comment 
          )
        );
      }

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

  const handleCommentDelete = async (comment_id, nested_comment_id=false) => {
    const url = nested_comment_id
    ? `http://127.0.0.1:8000/community/comment/${nested_comment_id}/`
    : `http://127.0.0.1:8000/community/comment/${comment_id}/`;
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


          if (nested_comment_id)  {
            setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === comment_id
                ? {
                    ...comment,
                    nested_comments: comment.nested_comments.map((nested_comment) =>
                      nested_comment.id === nested_comment_id
                        ? {
                            ...nested_comment,
                            deleted: true,
                            body: "[DELETED CONTENT]"
                          }
                        : nested_comment
                    ),
                }
                : comment
            )); 
          }else{
            setComments((prevComments) =>
              prevComments.map(comment =>
                comment.id === comment_id ? { ...comment,
                    deleted: true,
                    body: "[DELETED CONTENT]"
                } : comment
              )
            );
          }

        }
    } catch (error) {
      console.error("Error delete comment:", error);
    }
  };

  const handleEditComment = async (comment_id, nested_comment_id=false) => {
    
    if (nested_comment_id)  {
      console.log('this is nested comment')
      setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === comment_id
          ? {
              ...comment,
              nested_comments: comment.nested_comments.map((nested_comment) =>
                nested_comment.id === nested_comment_id
                  ? {
                      ...nested_comment,
                      editing: true,
                      edit_text_area: nested_comment.body
                    }
                  : nested_comment
              ),
          }
          : comment
      )); 
    }else{
      setComments((prevComments) =>
        prevComments.map(comment =>
          comment.id === comment_id
              ? {
                  ...comment,
                  editing: true,
                  edit_text_area: comment.body
              }
              : comment
      ));
    }
  };

  const handleEditCommentTextArea = async (comment_id, value, nested_comment_id=false) => {
    if (nested_comment_id) {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === comment_id
            ? {
                ...comment,
                nested_comments: comment.nested_comments.map((nested_comment) =>
                  nested_comment.id === nested_comment_id
                    ? {
                        ...nested_comment,
                        edit_text_area: value,
                      }
                    : nested_comment
                ),
              }
            : comment
        )
      );
    }else{
      setComments((prevComments) =>
        prevComments.map(comment =>
          comment.id === comment_id
            ? {
                ...comment,
                edit_text_area: value
            }
            : comment
      ));

    }
  };

  const handleEditCommentCancel = async (comment_id, nested_comment_id=false) => {
    if (nested_comment_id) {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === comment_id
            ? {
                ...comment,
                nested_comments: comment.nested_comments.map((nested_comment) =>
                  nested_comment.id === nested_comment_id
                    ? {
                        ...nested_comment,
                        editing: false,
                        edit_text_area: ''
                      }
                    : nested_comment
                ),
              }
            : comment
        )
      );
    }else{
      setComments((prevComments) =>
        prevComments.map(comment =>
          comment.id === comment_id
            ? {
                ...comment,
                editing: false,
                edit_text_area: ''
            }
            : comment
      ));
    }
  };
  
  const handleEditCommentSave = async (comment_id, value, nested_comment_id=false) => {
    const url = nested_comment_id 
    ? `http://127.0.0.1:8000/community/comment/${nested_comment_id}/`
    : `http://127.0.0.1:8000/community/comment/${comment_id}/`;
    
    try {
        const response = await axios.patch(
            url,
            {
              "body": value
            },
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
            }
        );
        
        if (response.status == 200){

          
          if (nested_comment_id)  {
            setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === comment_id
                ? {
                    ...comment,
                    nested_comments: comment.nested_comments.map((nested_comment) =>
                      nested_comment.id === nested_comment_id
                        ? {
                            ...nested_comment,
                            editing: false,
                            body: value
                          }
                        : nested_comment
                    ),
                }
                : comment
            )); 
          }else{          
            setComments((prevComments) =>
              prevComments.map(comment =>
                comment.id === comment_id ? { ...comment,
                    editing: false,
                    body: value
                } : comment
              )
            );
          }
        }
    } catch (error) {
      console.error("Error edit comment:", error);
    }
  };
  
  const handleReplyComment = async (comment_id) => {
    setComments((prevComments) =>
      prevComments.map(comment =>
        comment.id === comment_id
          ? {
              ...comment,
              replying: true,
              reply_text_area: ''
          }
          : comment
    ));
    const url = `http://127.0.0.1:8000/community/comment/${comment_id}/`
    try {
        const response = await axios.get(
            url,
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
                    nested_comments: response.data.results.nested_comments,
                    show_nested_comments: true,
                    next_comment_page: response.data.next
                } : comment 
              )
            );
        }
    } catch (error) {
      console.error("Error edit comment:", error);
    }
  };

  const handleReplyCommentTextArea = async (comment_id, value) => {
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

  const handleReplyCommentCancel = async (comment_id) => {
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
  
  const handleReplyCommentSave = async (comment_id, value) => {
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
        
        if (response.status == 201){
          console.log(response.data)
          setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === comment_id
              ? {
                  ...comment,
                  nested_comments: [
                    {
                      ...response.data, 
                      body: response.data.body,
                      user_temp_name: response.data.user_temp_name,
                      user_static_points: response.data.user_static_points,
                      user_school: response.data.user_school,
                      like_status: response.data.like_status,
                    },
                    ...comment.nested_comments, 
                  ],
                  reply_text_area: ''
              }
              : comment
          )); 
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

  const toggleCommentLike = async (comment_id, currentLikeStatus, nested_comment_id=false) => {
    const url = nested_comment_id
    ?  currentLikeStatus 
      ? `http://127.0.0.1:8000/community/comment/${nested_comment_id}/unlike/`
      : `http://127.0.0.1:8000/community/comment/${nested_comment_id}/like/`
    : currentLikeStatus
      ? `http://127.0.0.1:8000/community/comment/${comment_id}/unlike/`
      : `http://127.0.0.1:8000/community/comment/${comment_id}/like/`;
    try {
        const response = await axios.post(
            url,
            {},
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            }
        );
        if (response.status == 201){
          if (nested_comment_id)  {
            setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === comment_id
                ? {
                    ...comment,
                    nested_comments: comment.nested_comments.map((nested_comment) =>
                      nested_comment.id === nested_comment_id
                        ? {
                            ...nested_comment,
                            like_status: !currentLikeStatus,
                            likes_count: currentLikeStatus
                            ? nested_comment.likes_count - 1
                            : nested_comment.likes_count + 1,
                          }
                        : nested_comment
                    ),
                }
                : comment
            )); 
          }else{
            setComments((prevComments) =>
              prevComments.map((comment) =>
                comment.id === comment_id
                  ? {
                      ...comment,
                      like_status: !currentLikeStatus,
                      likes_count: currentLikeStatus
                      ? comment.likes_count - 1
                      : comment.likes_count + 1,
                  }
                  : comment
            ));
          }
        }
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
              <div id="article-detail-meta">
                  <span><strong>By: </strong> {article.user_temp_name}</span>
                  <span><strong>Points: </strong> {article.user_static_points}</span>
                  <span><strong>From: </strong> {article.user_school}</span>
                  <span><strong>Date: </strong> {new Date(article.created_at).toLocaleString()}</span>
                  <span><strong>Unicon: </strong> {article.unicon ? "Yes" : "No"}</span>
              </div>
              <div id="article-detail-stats">
                <span><strong>Views: </strong> {article.views_count}</span>
                <span><strong>Comments: </strong> {article.comments_count}</span>
                <span><strong>Likes: </strong> {article.likes_count}</span>
              </div>
              <button
                  onClick={toggleArticleLike}
                  className={article.like_status ? "liked" : "unliked"}
                >
                  {article.like_status ? "Unlike" : "Like"}
              </button>
            </>
          )}
        </div>


        <div id="article-detail-new-comments">
          <textarea
            value={newComment}
            id="article-detail-textarea"
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            disabled={submittingComment}
          />
          <button onClick={handleNewCommentSubmit} disabled={submittingComment}>
            {submittingComment ? "Submitting..." : "Submit"}
          </button>
        </div>


        <div id="article-detail-comments">
          
          {comments.map((comment) => (
            <div key={comment.id} id="article-detail-comment">

              <div id="article-detail-comment-body">
                {comment.editing ? (
                    <textarea
                      value={comment.edit_text_area}
                      id="article-detail-textarea"
                      onChange={(e) => handleEditCommentTextArea(comment.id, e.target.value)}
                      placeholder="Write your comment here..."
                      disabled={submittingComment}
                    />
                  ) : (
                    <p>{comment.body}</p>
                  )
                }
              </div>

              <div id="article-detail-comment-meta">
                <span><strong>By: </strong> {comment.user_temp_name}</span>
                <span><strong>Points: </strong> {comment.user_static_points}</span>
                <span><strong>From: </strong> {comment.user_school}</span>
                <span><strong>Date: </strong> {new Date(comment.created_at).toLocaleString()}</span>
              </div>

              <div id="article-detail-comment-buttons">
                  {!comment.deleted && (
                    <>
                      <button
                            onClick={() => toggleCommentLike(comment.id, comment.like_status)}
                            className={comment.like_status ? "liked" : "unliked"}
                        >
                            {comment.like_status ? "Unlike" : "Like"} ({comment.likes_count})
                        </button>
                        <button
                            onClick={() => handleReplyComment(comment.id)}
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
                          onClick={() => handleEditCommentCancel(comment.id)}
                          disabled={loadingMore}
                          >
                          Cancel
                          </button>
                          <button
                          onClick={() => handleEditCommentSave(comment.id, comment.edit_text_area)}
                          disabled={loadingMore}
                          >
                          Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                          onClick={() => handleEditComment(comment.id)}
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

              <div id = "article-detail-comment-reply">
                {comment.replying && (
                  <>

                    
                    <textarea
                      value={comment.reply_text_area}
                      id="article-detail-textarea"
                      onChange={(e) => handleReplyCommentTextArea(comment.id, e.target.value)}
                      placeholder="Write your comment here..."
                      disabled={submittingComment}
                    />
                    <div id="article-detail-comment-reply-buttons">
                      <button
                        onClick={() => handleReplyCommentCancel(comment.id)}
                        disabled={loadingMore}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplyCommentSave(comment.id, comment.reply_text_area)}
                        disabled={loadingMore}
                      >
                        Post
                      </button>
                    </div>
                    

                    <div id="article-detail-comment-reply-nested-comments"> 
                      
                      {comment.show_nested_comments && (

                        <div>
                          {comment.nested_comments.map((nested_comment) => (

                            <div key={nested_comment.id} id="article-detail-comment-reply-nested-comment">



                              <div id="article-detail-comment-reply-nested-comment-body">
                                {nested_comment.editing ? (
                                    <textarea
                                      value={nested_comment.edit_text_area}
                                      id="article-detail-comment-textarea"
                                      onChange={(e) => handleEditCommentTextArea(comment.id, e.target.value, nested_comment.id)}
                                      placeholder="Write your comment here..."
                                      disabled={submittingComment}
                                    />
                                  ) : (
                                    <p>{nested_comment.body}</p>
                                  )
                                }
                              </div>

                              <div id="article-detail-comment-reply-nested-comment-meta">
                                <span><strong>By: </strong> {nested_comment.user_temp_name}</span>
                                <span><strong>Points: </strong> {nested_comment.user_static_points}</span>
                                <span><strong>From: </strong> {nested_comment.user_school}</span>
                                <span><strong>Date: </strong> {new Date(nested_comment.created_at).toLocaleString()}</span>
                              </div>

                              <div id="article-detail-comment-reply-nested-comment-buttons">
                                  {!nested_comment.deleted && (
                                    <>
                                      <button
                                            onClick={() => toggleCommentLike(comment.id, nested_comment.like_status, nested_comment.id)}
                                            className={nested_comment.like_status ? "liked" : "unliked"}
                                        >
                                            {nested_comment.like_status ? "Unlike" : "Like"} ({nested_comment.likes_count})
                                        </button>
                                    </>
                                  )}
                                  {(nested_comment.user == user && !nested_comment.deleted) && (
                                    <>
                                      { nested_comment.editing ? (
                                        <>
                                          <button
                                          onClick={() => handleEditCommentCancel(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          >
                                          Cancel
                                          </button>
                                          <button
                                          onClick={() => handleEditCommentSave(comment.id, nested_comment.edit_text_area, nested_comment.id)}
                                          disabled={loadingMore}
                                          >
                                          Save
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                          onClick={() => handleEditComment(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          >
                                          Edit
                                          </button>
                                          <button
                                          onClick={() => handleCommentDelete(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          >
                                          Delete
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                              </div>
                            </div>
                          ))}

                        </div>

                      )}

                    </div>


                    <div id="article-detail-comment-reply-nested-comments-pagination-controls">
                      {comment.next_comment_page && (
                        <button
                          onClick={() => fetchNextNestedCommentPage(comment.id)}
                          disabled={loadingMore}
                          className="pagination-button"
                        >
                          Load More Nested Comments
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>
          ))}

        </div>

        <div id="article-detail-comments-pagination-controls">
          {nextCommentPage && (
            <button
              onClick={() => fetchNextCommentPage()}
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



