const querystring = require('querystring');
const https = require('https');

module.exports = {
  executeSearch(query, cb) {
    this.loadData(`/search/users?q=${querystring.escape(query)}`, cb);
  },

  loadProfile(username, cb) {
    this.loadData(`/users/${querystring.escape(username)}`, cb);
  },

  loadData(path, cb) {
    const options = {
      host: 'api.github.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'gitbot',
      },
    };
    const request = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        cb(JSON.parse(data));
      });
    });
    request.end();
  },
};
