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
  const color = localStorage.getItem("color");
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
              <div className="title">{article.title}</div>
              <div id="article-detail-article-name"> {article.user_temp_name}</div>
              <div id="article-detail-article-meta">
                <div> {article.user_static_points}p</div>‧
                <div> {article.user_school.toUpperCase()}</div>‧
                <div> {new Date(article.created_at).toLocaleString()}</div>‧          
                <div id="article-detail-article-meta-view-container"> 
                  <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="20px" fill="#A0AEC0"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>  
                  {article.views_count}
                </div>
              </div>
              <hr id="article-detail-article-hr"></hr>
              <div className="body">{article.body}</div>
              <div id="article-detail-article-actions">
                  <button
                  onClick={toggleArticleLike}
                    id={article.like_status ? "article-detail-article-liked" : "article-detail-article-unliked"}
                    >
                    <svg  id="article-detail-article-likes-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                    {article.likes_count}
                  </button>
                  <button 
                  onClick={toggleArticleLike}
                    id="article-detail-article-comments"
                    >
                    <svg   id="article-detail-article-comments-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>
                    {article.comments_count}
                  </button>
                </div>
            </>
          )}
        </div>


        <div id="article-detail-new-comments">
          <textarea
            value={newComment}
            id="article-detail--new-comment-textarea"
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What do you think?"
            disabled={submittingComment}
          />
          <button className="button"onClick={handleNewCommentSubmit} disabled={submittingComment}>
            {submittingComment ? "Submitting..." : "Submit"}
          </button>
        </div>


        <div id="article-detail-comments">
          
          {comments.map((comment) => (
            <>
              <div key={comment.id} id="article-detail-comment">
                <div id="article-detail-article-name"> {comment.user_temp_name}</div>
                <div id="article-detail-article-meta">
                  <div> {comment.user_static_points}p</div>‧
                  <div> {comment.user_school.toUpperCase()}</div>‧
                  <div> {new Date(comment.created_at).toLocaleString()}</div>
                </div>

                <div id="article-detail-comment-body">
                  {comment.editing ? (
                      <textarea
                        value={comment.edit_text_area}
                        id="article-detail-comment-edit-textarea"
                        onChange={(e) => handleEditCommentTextArea(comment.id, e.target.value)}
                        placeholder="Write your comment here..."
                        disabled={submittingComment}
                      />
                    ) : (
                      <div>{comment.body}</div>
                    )
                  }
                </div>

                <div id="article-detail-comment-buttons">
                    {!comment.deleted && (
                      <>
                        
                        <button
                        onClick={() => toggleCommentLike(comment.id, comment.like_status)}
                          id={comment.like_status ? "article-detail-article-liked" : "article-detail-article-unliked"}
                          >
                          <svg  id="article-detail-article-likes-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                          {comment.likes_count}
                        </button>
                          <button
                              onClick={() => handleReplyComment(comment.id)}
                              className="reply"
                          >
                          Reply {comment.comments_count}
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
                            className="editCancel"
                            >
                            Cancel
                            </button>
                            <button
                            onClick={() => handleEditCommentSave(comment.id, comment.edit_text_area)}
                            disabled={loadingMore}
                            className="editSave"
                            >
                            Save
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={loadingMore}
                            className="edit"
                            >
                            Edit
                            </button>
                            <button
                            onClick={() => handleCommentDelete(comment.id)}
                            disabled={loadingMore}
                            className="delete"
                            >
                            Delete
                            </button>
                          </>
                        )}
                      </>
                    )}
                </div>
              </div>

              <div id = "article-detail-comment-reply">
                {comment.replying && (
                  <>

                    <div id="article-detail-comment-reply-textarea-buttons">
                    <textarea
                      value={comment.reply_text_area}
                      id="article-detail-comment-reply-textarea"
                      onChange={(e) => handleReplyCommentTextArea(comment.id, e.target.value)}
                      placeholder="Write your comment here..."
                      disabled={submittingComment}
                    />
                    
                      <button
                        id="article-detail-comment-reply-text-area-button"
                        onClick={() => handleReplyCommentCancel(comment.id)}
                        disabled={loadingMore}
                      >
                        Cancel
                      </button>
                      <button
                        id="article-detail-comment-reply-text-area-button"
                        onClick={() => handleReplyCommentSave(comment.id, comment.reply_text_area)}
                        disabled={loadingMore}
                      >
                        Post
                      </button>
                    
                    </div>

                    <div id="article-detail-comment-reply-nested-comments"> 
                      
                      {comment.show_nested_comments && (

                        <>
                          {comment.nested_comments.map((nested_comment) => (

                            <div key={nested_comment.id} id="article-detail-comment-reply-nested-comment">

                            <div id="article-detail-article-name"> {nested_comment.user_temp_name}</div>
                            <div id="article-detail-article-meta">
                                <div> {nested_comment.user_static_points}p</div>‧
                                <div> {nested_comment.user_school.toUpperCase()}</div>‧
                                <div> {new Date(nested_comment.created_at).toLocaleString()}</div>‧          
                                <div id="article-detail-article-meta-view-container"> 
                                  <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="20px" fill="#A0AEC0"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>  
                                  {nested_comment.views_count}
                                </div>
                            </div>

                            <div id="article-detail-comment-body">
                                {nested_comment.editing ? (
                                    <textarea
                                      value={nested_comment.edit_text_area}
                                      id="article-detail-comment-edit-textarea"
                                      onChange={(e) => handleEditCommentTextArea(comment.id, e.target.value, nested_comment.id)}
                                      placeholder="Write your comment here..."
                                      disabled={submittingComment}
                                    />
                                  ) : (
                                    <p>{nested_comment.body}</p>
                                  )
                                }
                            </div>

                               <div id="article-detail-comment-buttons">
                                  {!nested_comment.deleted && (
                                    <>
                                      <button
                                            onClick={() => toggleCommentLike(comment.id, nested_comment.like_status, nested_comment.id)}
                                            id={nested_comment.like_status ? "article-detail-article-liked" : "article-detail-article-unliked"}
                                        >
                                          <svg  id="article-detail-article-likes-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                                            {nested_comment.likes_count}
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
                                          className="editCancel"
                                          >
                                          Cancel
                                          </button>
                                          <button
                                          onClick={() => handleEditCommentSave(comment.id, nested_comment.edit_text_area, nested_comment.id)}
                                          disabled={loadingMore}
                                          className="editSave"
                                          >
                                          Save
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                          onClick={() => handleEditComment(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          className="edit"
                                          >
                                          Edit
                                          </button>
                                          <button
                                          onClick={() => handleCommentDelete(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          className="delete"
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

                        </>

                      )}

                    </div>


                    <div id="article-detail-comment-reply-nested-comments-pagination-controls">
                      {comment.next_comment_page && (
                        <button
                          onClick={() => fetchNextNestedCommentPage(comment.id)}
                          disabled={loadingMore}
                          style={{color:color}}
                          id="article-detail-comment-reply-nested-comments-pagination-controls-button"
                        >
                          + More Reply
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

            </>
          ))}

        </div>

        <div id="article-detail-comments-pagination-controls">
          {nextCommentPage && (
            <button
              onClick={() => fetchNextCommentPage()}
              disabled={loadingMore}
              style={{color:color}}
              id="article-detail-comments-pagination-controls-button"
            >
              + Load More
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;



