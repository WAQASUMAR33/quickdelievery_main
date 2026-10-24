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
  return decoded ? (decoded.userId || decoded.id) : null;
}

// Verify auth from request headers or cookies
export async function verifyAuth(request) {
  try {
    const authHeader = request?.headers?.get?.('authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request?.headers?.get?.('cookie') || '';
      const match = cookieHeader.match(/(?:token|auth_token)=([^;]+)/);
      if (match) token = match[1];
    }
    if (!token) {
      return { success: false, error: 'No token provided' };
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return { success: false, error: 'Invalid or expired token' };
    }
    const userId = decoded.userId || decoded.id;
    return {
      success: true,
      user: {
        ...decoded,
        id: userId,
        userId: userId,
      },
    };
  } catch (err) {
    return { success: false, error: err.message || 'Authentication failed' };
  }
}
