'use strict';

require('@babel/polyfill');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: ['@babel/polyfill', path.resolve(__dirname, '../app')],
  output: {
    path: path.resolve(__dirname, '../../build'),
    filename: 'main.bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: 'app/index.html'
    })
  ],
  resolve: {
    alias: {
      Components: path.resolve(__dirname, '../app/components/'),
      SocketIO: path.resolve(__dirname, '../app/socket/')
    }
  }
};
