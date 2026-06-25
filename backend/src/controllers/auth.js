import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import supabase, { isSupabaseConfigured } from '../lib/supabase.js';

const SALT_ROUNDS = 12;
const JWT_EXPIRY = process.env.JWT_EXPIRES_IN || '30d';

const signToken = (user) =>
  jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return res.status(409).json({ error: `That ${field} is already taken` });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const byEmail = identifier.includes('@');
    const user = byEmail
      ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: identifier } });

    if (!user) {
      return res.status(401).json({
        error: byEmail
          ? 'No account found with that email address'
          : 'No account found with that username',
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'This account uses Google sign-in — please use the Google button to log in' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const googleAuth = async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'access_token is required' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Google sign-in is not configured on the server' });
  }

  try {
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(access_token);
    if (error || !supabaseUser) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const email = supabaseUser.email;
    if (!email) {
      return res.status(400).json({ error: 'Google account has no email address' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const displayName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';
      const base = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 20) || email.split('@')[0].slice(0, 20);

      let username = base;
      let attempt = 0;
      while (await prisma.user.findUnique({ where: { username } })) {
        attempt++;
        username = `${base}${attempt}`;
      }

      user = await prisma.user.create({ data: { username, email, passwordHash: null } });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    console.error('googleAuth error:', err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
