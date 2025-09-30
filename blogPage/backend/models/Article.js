const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  page: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: String,
  author: String,
  previousContent: String,
  urlArticle: String
});

const Article = mongoose.model('Article', articleSchema, 'menu_components');

module.exports = Article;
