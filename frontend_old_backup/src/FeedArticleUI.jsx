import { useNavigate } from "react-router-dom";
import {API_URL} from "./constants";
import {fetchAPI} from "./utils";
import {useState} from "react";
import './FeedArticleUI.css';

const FeedArticleUI = (article_data = {}) => {
    const [article, setArticleState] = useState(article_data);    
    const navigate = useNavigate(); 
    const user = localStorage.getItem('user');

    const handleLike = async () => {
        const url = article.like_status
            ? `${API_URL}/community/article/${article.id}/unlike/`
            : `${API_URL}/community/article/${article.id}/like/`;

        const response_data = await fetchAPI(url, {method: 'POST'})
        if (response_data) {
            setArticleState((prevState) => ({
              ...prevState,
              like_status: !prevState.like_status,
              likes_count: prevState.likes_count + (prevState.like_status ? -1 : 1),
            }));
        }
    };
    
    const handleSave = async () => {
        const url = article.save_status
        ? `${API_URL}/community/article/${article.id}/unsave/`
        : `${API_URL}/community/article/${article.id}/save/`;
        
        const data = await fetchAPI(url, {method: 'POST'})
        if (data) {
            setArticleState((prevState) => ({
            ...prevState,
            save_status: !article.save_status,
            }));
        }    
    };
  
    return (
        <div 
        id={article.view_status ? "feed-article-viewed":"feed-article-default"}
        key={article.id}
        >
        <div  onClick={() => navigate(`/article/${article.id}`)}>
        <div id="feed-article-title">{article.title}</div>
        <div id="feed-article-info">

            {user == article.user ? (
                <div> {article.user_temp_name} (You)</div>
            ):(
                <div> {article.user_temp_name}</div>
            )}

            <div>{article.user_static_points}points</div>

            <div>{new Date(article.created_at).toLocaleString()}</div>

            {article.views_count}views

            {article.unicon &&(
                <div>{article.user_school.toUpperCase()}</div>
            )}

            {(!article.deleted && article.edited) && (
                <div>edited</div>
            )}

        </div>
        <hr id="feed-article-line"></hr>
        <div id="feed-article-body" >{article.body}</div>
        {article.tag.length != 0 && (
            <div id="courses">
            {article.tag.split(",").map((tag, index) => (
                
                <button
                    id="emptyGrayButton"
                    key={index}
                    disabled={true}
                >
                    {tag}
                </button>

            ))}
            </div>
        )}
        </div>
            <div id="feed-article-buttons">
                <button onClick={() => handleLike()}
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
                onClick={() => handleSave()}
                id="save"
                >
                {article.save_status?
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2d3748"><path d="M713-600 600-713l56-57 57 57 141-142 57 57-198 198ZM200-120v-640q0-33 23.5-56.5T280-840h240v80H280v518l200-86 200 86v-278h80v400L480-240 200-120Zm80-640h240-240Z"/></svg>
                :<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2d3748"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>
                }
                </button>
            </div>
        </div>
    )
}

export default FeedArticleUI;
export {FeedArticleUI};