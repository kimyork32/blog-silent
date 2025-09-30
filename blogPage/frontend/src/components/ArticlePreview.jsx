import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ArticlePreview.css';

const ArticlePreview = ({ article }) => {
  return (
    <div className="article-preview">
      <img src={article.image} alt={article.title} className="article-image" />
      <div className="article-content">
        <h2 className="article-title">{article.title}</h2>
        <p className="article-author">Por: {article.author}</p>
        <p className="article-previous-content">{article.previousContent}</p>
        <Link to={`/${encodeURIComponent(article.urlArticle)}`} className="read-more-btn">Leer más</Link>
      </div>
    </div>
  );
};

export default ArticlePreview;
