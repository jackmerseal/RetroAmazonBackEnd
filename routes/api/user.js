import express from 'express';
import debug from 'debug';
const debugUser = debug('app:User');
debugUser.color = 14;
import { addUser } from '../../database.js';

const router = express.Router();

router.get('/list', (req, res) => {
  debugUser('Getting all users');
  res.send('Hello From Amazon.com User Route!');
});

router.post('/add', async (req, res) => {
  const newUser = req.body;
  try {
    const result = await addUser(newUser);
    res.status(200).json({message: `User ${result.insertedId} added`});
  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

export { router as UserRouter };
