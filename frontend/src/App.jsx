// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './Register';
import Validation from './Validation';
import Login from './Login';
import Navbar from './Navbar';
import Community from './Community';
import ArticleDetail from './ArticleDetail';

const App = () => {
  return (
    <Router>
      <Navbar />
        <div>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/validation" element={<Validation />} />
              <Route path="/community" element={<Community />} />
              <Route path="/article/:articleId" element={<ArticleDetail />} /> 
            </Routes>
        </div>
    </Router>
  );
};
export default App;