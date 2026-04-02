import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Driver from '../models/Driver.model.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ token, user });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });

    const user = await User.create({ name, email, password, role });

    // If role is driver, create a matching Driver profile
    if (role === 'driver') {
      const driver = await Driver.create({
        name,
        phone: '0000000000', // Placeholder as it is a required field
        user: user._id,
      });
      user.driverProfile = driver._id;
      await user.save();
    }

    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PATCH /api/auth/change-password  (protected)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
