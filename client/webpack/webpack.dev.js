'use strict';

const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');
const dotenv = require('dotenv');
const common = require('./webpack.common.js');

const env = dotenv.config().parsed;
env.API_URL = env.DEV_API_URL;

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[next] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = merge(common, {
  mode: 'development',
  target: 'web',
  devtool: 'eval-source-map',
  plugins: [
    new webpack.DefinePlugin(envKeys)
  ],
  devServer: {
    contentBase: path.resolve(__dirname, '../public'),
    compress: true,
    port: 3000,
    historyApiFallback: true,
  }
});
