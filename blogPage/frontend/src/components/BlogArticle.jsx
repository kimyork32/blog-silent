import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/BlogArticle.css';

const BlogArticle = () => {
  const { url } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('http://localhost:5000/api/article', {
          params: { url },
        });

        const articleData = response.data;
        articleData.webUrl = `http://localhost:5173${url}`;

        setData(articleData);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al obtener el artículo');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [url]);

  if (loading) return <p className="loading">Cargando...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!data || !data.article) return <p className="no-data">No hay datos para mostrar</p>;

  const { title, authors, category, content, webUrl } = data.article;

  const firstSectionWithImage = content.find(section => section.image);

  return (
    <div className="article-container">
      {firstSectionWithImage && (
        <div className="header-block" style={{ backgroundImage: `url(${firstSectionWithImage.image})` }}>
          <div className="header-content">
            <h1>{title}</h1>
            {authors && (
              <p className="article-author">
                <strong>Autor:</strong> {authors.join(', ')}
              </p>
            )}
            {category && (
              <div className="category-list">
                {category.map((cat, index) => (
                  <span key={index} className="category-item">{cat}</span>
                ))}
              </div>
            )}
          </div>
          <div className="overlay"></div>
        </div>
      )}

      {content && content.slice(1).map((section, index) => (
        <div key={index} className="section">
          {/* Subtítulo */}
          {section.subtitle && <h2>{section.subtitle}</h2>}

          {/* Imagen */}
          {section.image && (
            <div>
              <img
                src={section.image}
                alt={section.imgcaption || 'Imagen del artículo'}
                className="article-image"
              />
              {section.imgcaption && <p><em>{section.imgcaption}</em></p>}
            </div>
          )}

          {/* Párrafos */}
          {section.paragraphs && section.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} dangerouslySetInnerHTML={{ __html: paragraph }} />
          ))}

          {/* Tabla */}
          {section.table && (
            <table>
              <thead>
                <tr>
                  {Object.keys(section.table[0]).map((header, thIndex) => (
                    <th key={thIndex}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Lista */}
          {section.list && (
            <ul>
              {section.list.map((item, lIndex) => (
                <li key={lIndex} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default BlogArticle;
