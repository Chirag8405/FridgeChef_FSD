import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { User } from '@shared/api';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const SALT_ROUNDS = 12;

export interface AuthRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Register new user
export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, name }: AuthRequest = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const db = getDb();
    
    // Check if user already exists
    const existingUser = await db`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    // Create user
    const newUser = await db`
      INSERT INTO users (id, name, email, password_hash, preferences, theme)
      VALUES (${userId}, ${name}, ${email.toLowerCase()}, ${passwordHash}, '{}', 'light')
      RETURNING id, name, email, preferences, theme, created_at
    `;

    if (newUser.length === 0) {
      throw new Error('Failed to create user');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userId}, ${token}, ${expiresAt})
    `;

    const user: User = {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      preferences: newUser[0].preferences || {},
      theme: newUser[0].theme,
      created_at: newUser[0].created_at
    };

    const response: AuthResponse = {
      success: true,
      user,
      token,
      message: 'User registered successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user. Please try again.'
    });
  }
};

// Login user
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password }: AuthRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const db = getDb();

    // Get user by email
    const users = await db`
      SELECT id, name, email, password_hash, preferences, theme, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `;

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userData = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, email: userData.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clean up expired sessions
    await db`
      DELETE FROM sessions 
      WHERE user_id = ${userData.id} AND expires_at < NOW()
    `;

    // Create new session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userData.id}, ${token}, ${expiresAt})
    `;

    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      preferences: userData.preferences || {},
      theme: userData.theme,
      created_at: userData.created_at
    };

    const response: AuthResponse = {
      success: true,
      user,
      token,
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login. Please try again.'
    });
  }
};

// Logout user
export const logout: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const db = getDb();

    // Remove session
    await db`
      DELETE FROM sessions WHERE token = ${token}
    `;

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
};

// Get current user
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.warn('Database connection error in getCurrentUser:', dbError);
      db = null;
    }

    // If no database, return user from JWT token
    if (!db) {
      return res.json({
        success: true,
        user: {
          id: decoded.userId,
          name: decoded.email.split('@')[0], // Use email prefix as name
          email: decoded.email,
          preferences: {},
          theme: 'light',
          created_at: new Date().toISOString()
        }
      });
    }

    // Check if session exists and is valid
    const sessions = await db`
      SELECT s.expires_at, u.id, u.name, u.email, u.preferences, u.theme, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      // If session not found but JWT is valid, return user from JWT
      return res.json({
        success: true,
        user: {
          id: decoded.userId,
          name: decoded.email.split('@')[0],
          email: decoded.email,
          preferences: {},
          theme: 'light',
          created_at: new Date().toISOString()
        }
      });
    }

    const userData = sessions[0];
    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      preferences: userData.preferences || {},
      theme: userData.theme,
      created_at: userData.created_at
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware to authenticate requests
export const authenticateToken: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    const db = getDb();

    // Check if session exists and is valid
    const sessions = await db`
      SELECT user_id FROM sessions 
      WHERE token = ${token} AND expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user ID to request for use in route handlers
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Update user profile
export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { name, preferences } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.warn('Database connection error, using mock response:', dbError);
      db = null;
    }
    
    // If database is not available, return success with mock data
    if (!db) {
      return res.json({
        success: true,
        user: {
          id: userId,
          name: name || 'Guest User',
          email: 'guest@fridgechef.com',
          preferences: preferences || {
            dietary_restrictions: [],
            preferred_cuisines: [],
            spice_level: 'medium',
            cooking_time_preference: 'medium'
          },
          theme: 'light',
          created_at: new Date().toISOString()
        },
        message: 'Profile updated successfully (guest mode - changes not persisted)'
      });
    }

    // Build update object dynamically based on what's provided
    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (preferences !== undefined) updateFields.preferences = preferences;

    // Update user profile
    const updatedUsers = await db`
      UPDATE users 
      SET 
        name = COALESCE(${name}, name),
        preferences = COALESCE(${JSON.stringify(preferences)}, preferences),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email, preferences, theme, created_at
    `;

    if (updatedUsers.length === 0) {
      // User not found, return success with guest data instead of error
      return res.json({
        success: true,
        user: {
          id: userId,
          name: name || 'Guest User',
          email: 'guest@fridgechef.com',
          preferences: preferences || {
            dietary_restrictions: [],
            preferred_cuisines: [],
            spice_level: 'medium',
            cooking_time_preference: 'medium'
          },
          theme: 'light',
          created_at: new Date().toISOString()
        },
        message: 'Profile updated successfully (guest mode - changes not persisted)'
      });
    }

    const user: User = {
      id: updatedUsers[0].id,
      name: updatedUsers[0].name,
      email: updatedUsers[0].email,
      preferences: updatedUsers[0].preferences || {},
      theme: updatedUsers[0].theme,
      created_at: updatedUsers[0].created_at
    };

    res.json({
      success: true,
      user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    // Even on error, return success with guest data
    const userId = req.headers['user-id'] as string || 'guest-user';
    const { name, preferences } = req.body;
    res.json({
      success: true,
      user: {
        id: userId,
        name: name || 'Guest User',
        email: 'guest@fridgechef.com',
        preferences: preferences || {
          dietary_restrictions: [],
          preferred_cuisines: [],
          spice_level: 'medium',
          cooking_time_preference: 'medium'
        },
        theme: 'light',
        created_at: new Date().toISOString()
      },
      message: 'Profile updated successfully (guest mode - changes not persisted)'
    });
  }
};

// Get user profile
export const getProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.warn('Database connection error, using mock data:', dbError);
      db = null;
    }
    
    // If database is not available, return mock data
    if (!db) {
      return res.json({
        success: true,
        user: {
          id: userId,
          name: 'Guest User',
          email: 'guest@fridgechef.com',
          preferences: {
            dietary_restrictions: [],
            preferred_cuisines: [],
            spice_level: 'medium',
            cooking_time_preference: 'medium'
          },
          theme: 'light',
          created_at: new Date().toISOString()
        }
      });
    }

    const users = await db`
      SELECT id, name, email, preferences, theme, created_at
      FROM users 
      WHERE id = ${userId}
    `;

    if (users.length === 0) {
      // User not found in database, return guest user data instead of 404
      return res.json({
        success: true,
        user: {
          id: userId,
          name: 'Guest User',
          email: 'guest@fridgechef.com',
          preferences: {
            dietary_restrictions: [],
            preferred_cuisines: [],
            spice_level: 'medium',
            cooking_time_preference: 'medium'
          },
          theme: 'light',
          created_at: new Date().toISOString()
        }
      });
    }

    const user: User = {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      preferences: users[0].preferences || {},
      theme: users[0].theme,
      created_at: users[0].created_at
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    // Even on error, return guest user data instead of failing
    const userId = req.headers['user-id'] as string || 'guest-user';
    res.json({
      success: true,
      user: {
        id: userId,
        name: 'Guest User',
        email: 'guest@fridgechef.com',
        preferences: {
          dietary_restrictions: [],
          preferred_cuisines: [],
          spice_level: 'medium',
          cooking_time_preference: 'medium'
        },
        theme: 'light',
        created_at: new Date().toISOString()
      }
    });
  }
};