import express from 'express';
import { BookRouter } from './routes/api/book.js';
import { UserRouter } from './routes/api/user.js';
import * as dotenv from 'dotenv';
dotenv.config();

//create a debug channel called app:Server
import debug from 'debug';
const debugServer = debug('app:Server');
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authMiddleware } from '@merlin4/express-auth';

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(authMiddleware(process.env.JWT_SECRET, 'authToken', {
  httpOnly: true,
  maxAge: 1000 * 60 * 60,
}));

//middleware
//allow form data
app.use(express.urlencoded({ extended: true }));

//NO MIDDLEWARE GOES BELOW THESE ROUTES!!!
//NO MIDDLEWARE GOES BELOW THESE ROUTES!!!
//NO MIDDLEWARE GOES BELOW THESE ROUTES!!!
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
  //debugServer(err.stack);
  res.status(err.status).json({error: err.message});
});

const port = process.env.PORT || 3005;

//listen on port 3003
app.listen(port, () => {
  debugServer(`Server is listening on http://localhost:${port}`);
});
