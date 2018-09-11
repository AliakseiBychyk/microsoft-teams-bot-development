const creds = require('./secret/config.json');
const env = process.env;

module.exports = {
  APP_ID: env.APP_ID || creds.APP_ID,
  APP_PASSWORD: env.APP_PASSWORD || creds.APP_PASSWORD,
  PORT: env.PORT || 3978,
};
