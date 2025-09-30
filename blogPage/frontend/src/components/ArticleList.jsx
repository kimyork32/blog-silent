import React, { useState, useEffect } from 'react';
import ArticlePreview from './ArticlePreview';
import { useNavigate, useLocation } from 'react-router-dom';

const ArticleList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = parseInt(new URLSearchParams(location.search).get("page") || "1");
  const totalPages = 4;

  const [currentArticles, setCurrentArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/articles?page=${currentPage}`);
        const data = await response.json();
        setCurrentArticles(data);
        setLoading(false);  
      } catch (error) {
        console.error('Error al obtener los artículos:', error);
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      navigate(`?page=${currentPage + 1}`);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      navigate(`?page=${currentPage - 1}`);
    }
  };

  return (
    <div className="article-list">
      <h1>Blog de Silent Hill</h1>
      {loading ? (
        <p>Cargando artículos...</p>
      ) : (
        <div className="articles-container">
          {currentArticles.map((article, index) => (
            <ArticlePreview key={index} article={article} />
          ))}
        </div>
      )}

      <div className="pagination">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>Anterior</button>
        <span>Página {currentPage}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Siguiente</button>
      </div>
    </div>
  );
};

export default ArticleList;
