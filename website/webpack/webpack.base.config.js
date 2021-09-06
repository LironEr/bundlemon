/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const getBaseConfig = (isProd) => {
  return {
    context: path.resolve(__dirname, '../'),
    entry: './src/index.tsx',
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/i,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, '../src'),
      },
    },
    plugins: [
      new Dotenv({ path: `config/${isProd ? 'prod' : 'dev'}.env` }),
      new HtmlWebpackPlugin({
        template: 'src/index.html',
      }),
      new ForkTsCheckerWebpackPlugin({
        async: !isProd,
      }),
      new ESLintPlugin({
        files: 'src/**/*',
      }),
    ],
  };
};

module.exports = getBaseConfig;
