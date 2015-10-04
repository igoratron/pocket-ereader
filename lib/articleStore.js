const articleCache = new Map();

module.exports = {
  add: (id, content) => articleCache.set(id, content),
  get: id => articleCache.get(id),
  getAll: () => {
    const articles = [];

    for(var article of articleCache.values()) {
      articles.push(article);
    }

    return articles;
  }
};
