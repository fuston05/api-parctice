// server.js  
const express = require('express');
const server = express();
const helmet = require('helmet');

server.use(helmet());
server.use(express.json());

// define routers
const userRouter = require('../data/userRouter');

// use routers
server.use('/api/users', userRouter);

server.get('/', (req, res) => {
  res.send('Hello world');
});

module.exports = server;