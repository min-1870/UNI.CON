import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { API_URL } from "./constants";
import axios from "axios";
import './ArticleDetail.css';
import './constants.css';

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
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate("/community")    
  };

  useEffect(() => {
    fetchArticleDetails();
  }, [articleId]);

  const fetchArticleDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/community/article/${articleId}`, {
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
            `${API_URL}/community/comment/`,
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
    ? `${API_URL}/community/comment/${nested_comment_id}/`
    : `${API_URL}/community/comment/${comment_id}/`;
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
    ? `${API_URL}/community/comment/${nested_comment_id}/`
    : `${API_URL}/community/comment/${comment_id}/`;
    
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
    const url = `${API_URL}/community/comment/${comment_id}/`
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
    const url = `${API_URL}/community/comment/`
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
      ? `${API_URL}/community/article/${article.id}/unlike/`
      : `${API_URL}/community/article/${article.id}/like/`;
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
      ? `${API_URL}/community/comment/${nested_comment_id}/unlike/`
      : `${API_URL}/community/comment/${nested_comment_id}/like/`
    : currentLikeStatus
      ? `${API_URL}/community/comment/${comment_id}/unlike/`
      : `${API_URL}/community/comment/${comment_id}/like/`;
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


  const handleArticleEdit = async () => {
    setArticle((prevArticle)=> ({
      ...prevArticle,
      editing: true,
      title_edit_text_area: article.title,
      body_edit_text_area: article.body,
    }));
  };
  const handleArticleEditCancel = async () => {
    setArticle((prevArticle)=> ({
      ...prevArticle,
      editing: false,
      
    }));
  };
  const handleArticleEditSave = async () => {
    try {
        const response = await axios.patch(
            `${API_URL}/community/article/${articleId}/`,
            {
              "body": article.body_edit_text_area
            },
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
            }
        );
        
        if (response.status == 200){
          setArticle((prevArticle)=> ({
            ...prevArticle,
            title_edit_text_area: '',
            body_edit_text_area: '',
            editing: false,
            body: response.data.body
          }));
        }
    } catch (error) {
      console.error("Error edit comment:", error);
    }
  };

  const handleTitleTextarea = async (title) => {
    setArticle((prevArticle)=> ({
      ...prevArticle,
      title_edit_text_area: title
    }));
  };

  const handleBodyTextarea = async (body) => {
    setArticle((prevArticle)=> ({
      ...prevArticle,
      body_edit_text_area: body
    }));
  };

  const handleArticleDelete = async () => {
    try {
        const response = await axios.delete(
            `${API_URL}/community/article/${articleId}/`,
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            }
        );
        
        if (response.status == 204){
          setArticle((prevArticle)=> ({
            ...prevArticle,
            title: '[DELETED ARTICLE]',
            body: '[DELETED CONTENT]'
          }));
        }
    } catch (error) {
      console.error("Error delete comment:", error);
    }
  };

  if (loading) return <p>Loading article...</p>;

  return (
    <div id="article-detail-container">
      <div id="article-detail-left"></div>
      <button onClick={handleBack} id="article-detail-back" style={{color:color}}>
        {'<'}
      </button>
      <div id="article-detail">


        
      <div id="article-detail-article">
            
              {article.editing ?(
                  <textarea
                    value={article.title_edit_text_area}
                    id="edit-textarea"
                    onChange={(e) => handleTitleTextarea(e.target.value)}
                    placeholder="Write your title here..."
                  />
              ):(
                <div id="title">{article.title}</div>
                
              )}

              <div id="article-detail-article-info">
                <div id="article-detail-article-name-meta">
                  {user == article.user ? (
                    <div id="name"> {article.user_temp_name} (You)</div>
                  ):(
                    <div id="name"> {article.user_temp_name}</div>
                  )}
                  <div id="meta">
                    <div> {article.user_static_points}p</div>‧
                    <div> {article.user_school.toUpperCase()}</div>‧
                    <div> {new Date(article.created_at).toLocaleString()}</div>‧          
                    <div className="view-container"> 
                      <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="20px" fill="#A0AEC0"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>  
                      {article.views_count}
                    </div>
                  </div>
                </div>
                {article.unicon &&(
                    <div id="article-detail-article-unicon-initial">UNICON</div>
                  )}
              </div>
              <hr id="line"></hr>
              {article.editing ?(
                  <textarea
                    value={article.body_edit_text_area}
                    id="edit-textarea"
                    onChange={(e) => handleBodyTextarea(e.target.value)}
                    placeholder="Write your body here..."
                  />
              ):(
                <div id="body">{article.body}</div>
                
              )}
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
              {(!article.deleted && article.edited) &&(
                <div id="edited">edited</div>
              )}
              <div id="article-detail-article-actions">
              <div className="like-comment">
                  <button
                  onClick={toggleArticleLike}
                    id={article.like_status ? "like" : "unlike"}
                    >
                    <svg  className="like-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                    {article.likes_count}
                  </button>
                  <button 
                  onClick={toggleArticleLike}
                  id="comment"
                    >
                    <svg   className="comment-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>
                    {article.comments_count}
                  </button>
              </div>
              {user==article.user &&(
              <div class="edit-delete">
                {article.editing ? (
                  <>
                  <button
                  onClick={handleArticleEditCancel}
                    id="grayButton"
                    >
                    Cancel
                  </button>
                  <button
                  onClick={handleArticleEditSave}
                    id="greenButton"
                    >
                    Save
                  </button>
                  </>
                ):(
                  <>
                  <button
                  onClick={handleArticleEdit}
                    id="grayButton"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2d3748"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                    edit
                  </button>
                  <button 
                  onClick={handleArticleDelete}
                    id="redButton"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ff0000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                    delete
                  </button>
                  </>
                )}
              </div>
              )}
              </div>
        </div>
          
        


        <div id="article-detail-new-comments">
          <textarea
            value={newComment}
            id="article-detail-new-comment-textarea"
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What do you think?"
            disabled={submittingComment}
          />
          <button className="submit"onClick={handleNewCommentSubmit} disabled={submittingComment}>
            {submittingComment ? "Submitting..." : "Submit"}
          </button>
        </div>


        <div id="article-detail-comments">
          
          {comments.map((comment) => (
            <>
              <div key={comment.id} id="article-detail-comment">
                {user == comment.user ? (
                  <div id="name"> {comment.user_temp_name} (You)</div>
                ):(
                  <div id="name"> {comment.user_temp_name}</div>
                )}
                <div id="meta">
                  <div> {comment.user_static_points}p</div>‧
                  <div> {comment.user_school.toUpperCase()}</div>‧
                  <div> {new Date(comment.created_at).toLocaleString()}</div>
                </div>

                
                  {comment.editing ? (
                      <textarea
                        value={comment.edit_text_area}
                        id="edit-textarea"
                        onChange={(e) => handleEditCommentTextArea(comment.id, e.target.value)}
                        placeholder="Write your comment here..."
                        disabled={submittingComment}
                      />
                    ) : (
                      <div id='body'>{comment.body}</div>
                    )
                  }
                {(!comment.deleted && comment.edited) &&(
                  <div id="edited">edited</div>
                )}

                <div id="article-detail-comment-buttons">
                        
                        <button
                        onClick={() => toggleCommentLike(comment.id, comment.like_status)}
                          id={comment.like_status ? "like" : "unlike"}
                          >
                          <svg  className="like-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                          {comment.likes_count}
                        </button>
                          <button
                              onClick={() => handleReplyComment(comment.id)}
                              id="grayButton"
                          >
                          Reply {comment.comments_count}
                          </button>
                    {(comment.user == user && !comment.deleted) && (
                      <>
                        { comment.editing ? (
                          <>
                            <button
                            onClick={() => handleEditCommentCancel(comment.id)}
                            disabled={loadingMore}
                            id="grayButton"
                            >
                            Cancel
                            </button>
                            <button
                            onClick={() => handleEditCommentSave(comment.id, comment.edit_text_area)}
                            disabled={loadingMore}
                            id="greenButton"
                            >
                            Save
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={loadingMore}
                            id="grayButton"
                            >
                            Edit
                            </button>
                            <button
                            onClick={() => handleCommentDelete(comment.id)}
                            disabled={loadingMore}
                            id="redButton"
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

                    <div id="article-detail-comment-reply-container">
                    <textarea
                      value={comment.reply_text_area}
                      id="article-detail-comment-reply-textarea"
                      onChange={(e) => handleReplyCommentTextArea(comment.id, e.target.value)}
                      placeholder="Write your comment here..."
                      disabled={submittingComment}
                    />
                    
                      <button
                        id="grayButton"
                        onClick={() => handleReplyCommentCancel(comment.id)}
                        disabled={loadingMore}
                      >
                        Cancel
                      </button>
                      <button
                        id="grayButton"
                        onClick={() => handleReplyCommentSave(comment.id, comment.reply_text_area)}
                        disabled={loadingMore}
                      >
                        Post
                      </button>
                    
                    </div>

                    <div id="article-detail-comment-nested-comments"> 
                      
                      {comment.show_nested_comments && (

                        <>
                          {comment.nested_comments.map((nested_comment) => (

                            <div key={nested_comment.id} id="article-detail-comment-nested-comment">
                            {user == comment.user ? (
                              <div id="name"> {nested_comment.user_temp_name} (You)</div>
                            ):(
                              <div id="name"> {nested_comment.user_temp_name}</div>
                            )}
                            
                            <div id="meta">
                                <div>{nested_comment.user_static_points}p</div>
                                <div> {nested_comment.user_school.toUpperCase()}</div>‧
                                <div> {new Date(nested_comment.created_at).toLocaleString()}</div>
                            </div>

                            
                                {nested_comment.editing ? (
                                    <textarea
                                      value={nested_comment.edit_text_area}
                                      id="edit-textarea"
                                      onChange={(e) => handleEditCommentTextArea(comment.id, e.target.value, nested_comment.id)}
                                      placeholder="Write your comment here..."
                                      disabled={submittingComment}
                                    />
                                  ) : (
                                    <p id="body">{nested_comment.body}</p>
                                  )
                                }
                            

                              {(!nested_comment.deleted && nested_comment.edited) &&(
                                <div id="edited">edited</div>
                              )}
                               <div id="article-detail-comment-buttons">
                                  
                                    
                                      <button
                                            onClick={() => toggleCommentLike(comment.id, nested_comment.like_status, nested_comment.id)}
                                            id={nested_comment.like_status ? "like" : "unlike"}
                                        >
                                          <svg  className="like-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2D3748"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                                            {nested_comment.likes_count}
                                        </button>
                                    
                                  
                                  {(nested_comment.user == user && !nested_comment.deleted) && (
                                    <>
                                      { nested_comment.editing ? (
                                        <>
                                          <button
                                          onClick={() => handleEditCommentCancel(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          id='grayButton'
                                          >
                                          Cancel
                                          </button>
                                          <button
                                          onClick={() => handleEditCommentSave(comment.id, nested_comment.edit_text_area, nested_comment.id)}
                                          disabled={loadingMore}
                                          id='greenButton'
                                          >
                                          Save
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                          onClick={() => handleEditComment(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          id="grayButton"
                                          >
                                          Edit
                                          </button>
                                          <button
                                          onClick={() => handleCommentDelete(comment.id, nested_comment.id)}
                                          disabled={loadingMore}
                                          id="redButton"
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


                    <div>
                      {comment.next_comment_page && (
                        <button
                          onClick={() => fetchNextNestedCommentPage(comment.id)}
                          disabled={loadingMore}
                          style={{color:color}}
                          id="article-detail-comment-nested-comments-pagination-controls-button"
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



