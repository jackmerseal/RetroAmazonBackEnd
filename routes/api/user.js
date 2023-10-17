import express from 'express';
import debug from 'debug';
const debugUser = debug('app:User');
debugUser.color = 14;
import { addUser, loginUser } from '../../database.js';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import { validBody } from '../../middleware/validBody.js';

const router = express.Router();

//Step 1: define new user schema
const newUserSchema = Joi.object({
  fullName: Joi.string().trim().min(1).max(50).required(),
  password: Joi.string().trim().min(8).max(50).required(),
  email: Joi.string().trim().email().required(),
});

const loginUserSchema = Joi.object({
  password: Joi.string().trim().min(8).max(50).required(),
  email: Joi.string().trim().email().required(),
});

router.get('/list', (req, res) => {
  debugUser('Getting all users');
  res.send('Hello From Amazon.com User Route!');
});

router.post('/add', validBody(newUserSchema), async (req, res) => {
  const newUser = req.body;
  newUser.password = await bcrypt.hash(newUser.password, 10);
  try {
    const result = await addUser(newUser);
    res.status(200).json({ message: `User ${result.insertedId} added` });
  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

router.post('/login', validBody(loginUserSchema), async (req, res) => {
  const user = req.body;
    const resultUser = await loginUser(user);
    debugUser(resultUser);
    if (resultUser && await bcrypt.compare(user.password, resultUser.password)) {
      res.status(200).json(`Welcome ${resultUser.fullName}!`);
    }else{
      res.status(401).json(`email or password incorrect`);
    }
});

export { router as UserRouter };
