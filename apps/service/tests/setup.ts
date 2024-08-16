/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.development.env'),
});

process.env.MONGO_DB_NAME = 'test';
