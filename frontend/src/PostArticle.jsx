import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './PostArticle.css';


const PostArticle = () => {
  const [title, setTitle] = useState('');  
  const [body, setBody] = useState('');  
  const [unicon, setUnicon] = useState(false);  
  const [courses, setCourses] = useState([]);  
  const accessToken = localStorage.getItem("access");
  const navigate = useNavigate();

  const handleAddCrouseButton = async () => {
    const newCourse = '';
    setUnicon(false);
    setCourses((prevCourses) => [
      ...prevCourses, 
      newCourse       
    ]);
  };
  const handleAddCrouseTextarea = async ( value, index) => {
    setCourses((prevCourses) =>
      prevCourses.map((course, i) => (i === index ? value : course))
    );
  };

  const handleUniconToggle = async () => {
    setUnicon(!unicon);
  };

  const handlePostArticleButton = async () => {
    // setSubmittingComment(true);
    // const courses_code = (courses.length > 0)
    // ? courses
    // : false
    try {
        const response = await axios.post(
            `http://127.0.0.1:8000/community/article/`,
            {
            title: title,
            body: body,
            unicon: unicon,
            course_code: courses
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
      console.error("Error submitting article:", error);
    }
  };


  return (
    
    <div id="post-article-container">
      <div id="post-article">
        <div id="post-article-title">
          <textarea
            value={title}
            id="post-article-textarea"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write your title here..."
          />
        </div>
        <div id="post-article-body">
          <textarea
            value={body}
            id="post-article-textarea"
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your body here..."
          />
        </div>
        <div id="post-article-buttons">
          <button
              onClick={() => handleUniconToggle()}
            >
              {unicon ? "UNI.CON" : "OUR SCHOOL ONLY"}
          </button>
          {( unicon || (!unicon && courses.length == 0)) && (
              <button
              onClick={() => handleAddCrouseButton()}
              >
              {unicon ? "Add courses (This will disable UNI.CON)" : "Add courses"}
              </button>
            )
          } 
        </div>
        <div id="post-article-courses">
            { (!unicon && courses.length > 0) && (
              <>
                {courses.map((course, index) => (
                  <div key={index} id="post-article-course">
                    <textarea
                      value={course}
                      id="post-article-textarea"
                      onChange={(e) => handleAddCrouseTextarea(e.target.value, index)}
                      placeholder="Write your body here..."
                    />
                  </div>
                ))}
                <button
                  onClick={() => handleAddCrouseButton()}
                >
                  Add More
                </button>
              </>
            )}
        </div>
        <button
          onClick={() => handlePostArticleButton()}
        >
          Post
        </button>
      </div>
    </div>    
  );
};


export default PostArticle;
