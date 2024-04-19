const { merge } = require('webpack-merge');
const getBaseConfig = require('./webpack.base.config');
const devConfig = require('./webpack.dev.config');
const prodConfig = require('./webpack.prod.config');

module.exports = (env) => {
  if (env.development) {
    return merge(getBaseConfig(false), devConfig);
  }

  if (env.prod) {
    return merge(getBaseConfig(true), prodConfig);
  }

  throw new Error('No matching configuration was found!');
};
