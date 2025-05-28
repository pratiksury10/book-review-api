const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
};

exports.signup = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Please provide username and password' });

  const userExists = await User.findOne({ username });
  if (userExists)
    return res.status(400).json({ message: 'Username already exists' });

  const user = await User.create({ username, password });

  res.status(201).json({
    _id: user._id,
    username: user.username,
    token: generateToken(user._id),
  });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Please provide username and password' });

  const user = await User.findOne({ username });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  res.json({
    _id: user._id,
    username: user.username,
    token: generateToken(user._id),
  });
};
