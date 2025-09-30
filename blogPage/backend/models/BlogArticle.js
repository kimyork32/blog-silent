const mongoose = require('mongoose');

const BlogArticleSchema = new mongoose.Schema({
  url: { type: String, required: true },
  article: {
    title: { type: String, required: true },
    authors: { type: [String], required: true },
    category: { type: [String], required: true },
    content: [{
      subtitle: { type: String, default: null },
      typeSubtitle: { type: String, default: null },
      image: { type: String, default: null },
      imgcaption: { type: String, default: null },
      paragraphs: { type: [String], default: [] },
      table: { type: Object, default: null },
      list: { type: [String], default: null },
    }]
  }
});

module.exports = mongoose.model('BlogArticle', BlogArticleSchema, 'articles');
