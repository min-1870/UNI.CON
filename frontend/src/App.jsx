// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './Register';
import Validation from './Validation';
import Login from './Login';
import Navbar from './Navbar';
import Community from './Community';

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
            </Routes>
        </div>
    </Router>
  );
};
export default App;
