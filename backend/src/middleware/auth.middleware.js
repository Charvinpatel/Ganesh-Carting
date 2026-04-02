import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Protect routes — requires a valid Bearer JWT
 */
export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User no longer exists.' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Restrict to specific roles — call after protect()
 * Usage: restrictTo('admin')
 */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }
  next();
};
