import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ArticleList from './components/ArticleList';
import BlogArticle from './components/BlogArticle';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="/:url" element={<BlogArticle />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;
