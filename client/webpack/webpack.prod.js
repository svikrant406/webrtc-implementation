'use strict';

const webpack = require('webpack');
const dotenv = require('dotenv');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const env = dotenv.config().parsed;
env.API_URL = env.PROD_API_URL;

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[next] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin(envKeys)
  ]
});
