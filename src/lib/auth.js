import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function getJwtSecret() {
  const secret = process.env.JWT_KEY;
  if (!secret) {
    throw new Error('JWT_KEY environment variable is not set');
  }
  return secret;
}

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
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

// Verify JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

// Get user ID from token
export function getUserIdFromToken(token) {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}
