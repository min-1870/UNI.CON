// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './Register';
import Validation from './Validation';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import Navbar from './Navbar';
import Feed from './Feed';
import MyPage from './MyPage';
import ArticleDetail from './ArticleDetail';
import PostArticle from './PostArticle';
import SearchResults from './SearchResults';
import './App.css';

const App = () => {
  return (
    <Router>
      <Navbar />
        <div id="app-div">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/validation" element={<Validation />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/postarticle" element={<PostArticle />} />
              <Route path="/searchresults" element={<SearchResults />} />
              <Route path="/article/:articleId" element={<ArticleDetail />} /> 
            </Routes>
        </div>
    </Router>
  );
};
export default App;
