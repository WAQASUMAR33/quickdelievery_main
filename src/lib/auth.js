import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_KEY || 'default-secret-key-do-not-use-in-production';

// Hash password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Sign JWT
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user ID from token
export function getUserIdFromToken(token) {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}
