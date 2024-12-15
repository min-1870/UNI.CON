import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './PostArticle.css';
import './constants.css';


const PostArticle = () => {
  const [title, setTitle] = useState('');  
  const [body, setBody] = useState('');  
  const [unicon, setUnicon] = useState(false);  
  const [courses, setCourses] = useState([]);  
  const [course, setCourse] = useState('');  
  const [error, setError] = useState(false);    
  const [errorMsg, setErrorMsg] = useState('');    
  const accessToken = localStorage.getItem("access");
  const points = localStorage.getItem('points') || 0;
  const initial = localStorage.getItem('initial') || '';
  const color = localStorage.getItem('color') || '#000';
  const navigate = useNavigate();

  const handleAddCrouseButton = async () => {
    if (courses.includes(course.toUpperCase().trim())){
      setError(true)
      setErrorMsg(`The "${course}" already exists.`)
    }else if (course.length == 0){
      setError(true)
      setErrorMsg(`The course name cannot be empty.`)
    }else{
      setCourses((prevCourses) => [
        ...prevCourses, 
        course.toUpperCase().trim()
      ]);
      setCourse('')
    }
   };

   const handleRemoveCrouseButton = async (index) => {
    setCourses((prevCourses) =>
      prevCourses.filter((_, i) => i !== index)
    );
   };
  
  const handleUniconToggle = async () => {
    setUnicon(!unicon);
  };

  const handlePostArticleButton = async () => {
    if (title.length == 0 || body.length == 0){
    setError(true)
    setErrorMsg(`The title or body cannot be empty.`)
    }else{
      try {
          const response = await axios.post(
              `http://127.0.0.1:8000/community/article/`,
              {
              title: title,
              body: body,
              unicon: unicon,
              course_code: unicon ? [] : courses
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
            navigate(`/article/${response.data.id}`)
          }
      } catch (error) {
        setError(true)
        setErrorMsg(error)
      }
    }
  };


  return (
    
    <div id="post-article-container">
      <div id="post-article-left"></div>
      <div id="post-article">
        <div id="post-article-description">
          Create the Post in<div id="post-article-school" style={{color:color}}>{initial.toUpperCase()}</div>
        </div>
        
        <div id="post-article-title">
          <textarea
            value={title}
            id="post-article-textarea-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write your title here..."
          />
        </div>
        
        <label id="post-article-unicon">
          <input id="post-article-cb" type="checkbox" checked={unicon} onClick={() => handleUniconToggle()}></input>
          <div id="post-article-label"> UNICON </div>{points} points
        </label>

        <div id="post-article-body">
          <textarea
            value={body}
            id="post-article-textarea-body"
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your body here..."
          />
        </div>

          
        <div id="post-article-add-course">
          <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                id="post-article-add-course-input"
                placeholder='add courses here..'
                disabled={unicon?true:false}
          />
          <button
              onClick={() => handleAddCrouseButton()}
              id="grayButton"
              className="add"
              disabled={unicon?true:false}
            >
              Add
          </button>
          {courses.map((course, index) => (
            
            <button
                onClick={() => handleRemoveCrouseButton(index)}
                id="grayButton"
                key={index}
                disabled={unicon?true:false}
              >
                {course}
            </button>

          ))}
        </div>
        
        <div id="post-article-buttons">
          {error &&(
            <div id='error-msg'>
              {errorMsg}
            </div>
          )}
          
          <button
            onClick={() => navigate('/community')}
            id="redButton"
          >
            Cancel
          </button>
          
        <button
          onClick={() => handlePostArticleButton()}
          id="greenButton"
        >
          Submit
        </button>
        </div>
      </div>
    </div>    
  );
};


export default PostArticle;
