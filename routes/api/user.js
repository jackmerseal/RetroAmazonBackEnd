import express from 'express';
import debug from 'debug';
const debugUser = debug('app:User');
debugUser.color = 14;
import {
  getUsers,
  getUserById,
  addUser,
  loginUser,
  updateUser,
  newId,
} from '../../database.js';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { validBody } from '../../middleware/validBody.js';
import { validId } from '../../middleware/validId.js';

const router = express.Router();

async function issueAuthToken(user) {
  const payload = { _id: user._id, fullName: user.fullName, role: user.role };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };

  const authToken = jwt.sign(payload, secret, options);
  return authToken;
}

function issueAuthCookie(res, authToken) {
  const cookieOptions = { httpOnly: true, maxAge: 1000 * 60 * 60 };
  res.cookie('authToken', authToken, cookieOptions);
}

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

const updateUserSchema = Joi.object({
  fullName: Joi.string().trim().min(1).max(50),
  password: Joi.string().trim().min(8).max(50),
});

router.get('/list', async (req, res) => {
  debugUser('Getting all users');
  try {
    let users = await getUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

router.post('/add', validBody(newUserSchema), async (req, res) => {
  const newUser = {
    _id: newId(),
    ...req.body,
    createdDate: new Date(),
  };

  newUser.password = await bcrypt.hash(newUser.password, 10);
  try {
    const result = await addUser(newUser);
    if (result.acknowledged == true) {
      //Ready to create the cookie and JWT Token
      const authToken = await issueAuthToken(newUser);
      issueAuthCookie(res, authToken);
      res
        .status(200)
        .json({
          message: `User ${result.insertedId} added. Your auth token is ${authToken}`,
        });
    }
  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

router.post('/login', validBody(loginUserSchema), async (req, res) => {
  const user = req.body;

  const resultUser = await loginUser(user);
  debugUser(resultUser);
  if (
    resultUser &&
    (await bcrypt.compare(user.password, resultUser.password))
  ) {
    const authToken = await issueAuthToken(resultUser);
    issueAuthCookie(res, authToken);
    res
      .status(200)
      .json(`Welcome ${resultUser.fullName}. Your auth token is ${authToken}`);
  } else {
    res.status(401).json(`email or password incorrect`);
  }
});

//Admin can update a user by the id
router.put(
  '/update/:id',
  validId('id'),
  validBody(updateUserSchema),
  async (req, res) => {
    debugUser('Admin Route Updating a user');
    const updatedUser = req.body;
    const user = await getUserById(req.id);
    //update user with updatedUser
    if (user) {
      if (updatedUser.fullName) {
        user.fullName = updatedUser.fullName;
      }
      if (updatedUser.password) {
        user.password = await bcrypt.hash(updatedUser.password, 10);
      }
      const dbResult = await updateUser(user);
      if (dbResult.modifiedCount == 1) {
        res.status(200).json({ message: `User ${req.id} updated` });
        return;
      }
    } else {
      res.status(400).json({ message: `User ${req.id} not updated` });
    }
  }
);

//Self Service Update

export { router as UserRouter };
