/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');

const config = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: true,
    port: 4000,
    open: false,
    hot: true,
    https: true,
    static: {
      directory: path.resolve(__dirname, '../public'),
    },
    client: {
      overlay: false,
    },
  },
};

module.exports = config;
