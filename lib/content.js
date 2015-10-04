const fetch = require('node-fetch');

const TOKEN = 'a8bdf1825ad4dd57c24a90cd57591335e4bbffdc';

module.exports = function(token) {
  return {
    get: function(url) {
      return fetch(`https://readability.com/api/content/v1/parser?url=${url}&token=${TOKEN}`)
        .then(data => data.json());
    }
  };
};
