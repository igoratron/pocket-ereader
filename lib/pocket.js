const fetch = require('node-fetch');

const POCKET_URL = {
  request: 'https://getpocket.com/v3/oauth/request',
  authorise: (requestToken, redirectUri) => `https://getpocket.com/auth/authorize?request_token=${requestToken}&redirect_uri=${redirectUri}`,
  accessToken: 'https://getpocket.com/v3/oauth/authorize',
  get: 'https://getpocket.com/v3/get'
};

function pocketFetch(url, body) {
  return fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF8',
      'X-Accept': 'application/json'
    },
    body: JSON.stringify(body)
  })
  .then((response) => new Promise((resolve, reject) => {
    if(response.status === 200) {
      resolve(response);
      return;
    }

    reject({
      status: response.status,
      message: response.statusText,
      error: response.headers.get('X-Error'),
      errorCode: response.headers.get('X-Error-Code'),
    });
  }))
  .then(res => res.json());
}

module.exports = function(consumerKey) {
  return {
    get: function(accessToken, body) {
      return pocketFetch(POCKET_URL.get, Object.assign(
        {},
        { consumer_key: consumerKey, access_token: accessToken },
        body
      ));
    }
  };
};
