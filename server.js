import express from 'express';
import { BookRouter } from './routes/api/book.js';
import { UserRouter } from './routes/api/user.js';
import * as dotenv from 'dotenv';
dotenv.config();

//create a debug channel called app:Server
import debug from 'debug';
const debugServer = debug('app:Server');

import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());

//middleware
//allow form data
app.use(express.urlencoded({ extended: true }));
app.use('/api/books', BookRouter);
app.use('/api/users', UserRouter);

//default route
app.get('/', (req, res) => {
  res.send('Hello From Amazon.com!');
  debugServer('Hello from the upgraded console.log()!');
});

//error handling middleware to handle routes not found
app.use((req,res) => {
  res.status(404).json({error:`Sorry couldn't find ${req.originalUrl}`});
});

//handle server exceptions to keep my server from crashing
app.use((err,req,res,next) => {
  debugServer(err.stack);
  res.status(500).json({error:`${err.stack}`});
});

const port = process.env.PORT || 3005;

//listen on port 3003
app.listen(port, () => {
  debugServer(`Server is listening on http://localhost:${port}`);
});
