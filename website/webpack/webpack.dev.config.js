/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const webpack = require('webpack');

const config = {
  mode: 'development',
  output: {
    publicPath: '/',
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    historyApiFallback: true,
    port: 4000,
    open: true,
    hot: true,
  },
};

module.exports = config;
