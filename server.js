require('dotenv').config();

const express = require('express');
const cors = require('cors');
const socket = require('./socket');

const app = express();

/* enable cors */
app.use(cors());

app.use(express.static('build'));

app.get('/*', function (req, res) {
  res.sendFile(__dirname + '/build/index.html');
});

/* 404 middleware */
app.use(function (req, res, next) {
  res.sendStatus(404);
});

/* internal server error middleware */
app.use(function (err, req, res, next) {
  console.error(err)
  res.sendStatus(500);
});

const server = app.listen(process.env.PORT || 5000, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`🚀️ Build mounted on port 5000`);
  };
});

/* socket */
socket(server);
