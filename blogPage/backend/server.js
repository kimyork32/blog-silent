const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.log('Error al conectar a MongoDB:', err));

const Article = require('./models/Article');
const BlogArticle = require('./models/BlogArticle');

app.get('/api/articles', async (req, res) => {
  const { page } = req.query;

  if (!page || isNaN(page)) {
    return res.status(400).json({ message: 'Por favor, envía un parámetro de página válido' });
  }

  try {
    const pageNum = parseInt(page);

    const articles = await Article.find({ page: pageNum });

    res.json(articles); 
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los artículos', error: err });
  }
});


app.get('/api/article', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: 'Por favor, envía una URL válida' });
  }

  try {
    const article = await BlogArticle.findOne({ url });

    console.log('Artículo encontrado:', article);

    if (!article) {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }

    res.json(article);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el artículo', error: err });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
