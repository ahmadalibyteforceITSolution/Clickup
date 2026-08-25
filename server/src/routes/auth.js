import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { notifyEmailVerification } from '../services/emailService.js';

const router = express.Router();

// 1. User Registration with 6-Digit Email Verification Code
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', department = 'Engineering', job_title = '', avatar = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      if (!existing.isEmailVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        existing.verificationCode = code;
        existing.verificationExpires = new Date(Date.now() + 30 * 60 * 1000);
        await existing.save();

        await notifyEmailVerification({ user: existing, verificationCode: code });
        return res.json({
          message: 'Account registered. Verification code dispatched!',
          email: existing.email,
          verificationCode: code,
          requiresVerification: true
        });
      }
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      department,
      job_title,
      avatar: avatar || '',
      isEmailVerified: false,
      verificationCode,
      verificationExpires
    });

    // Send verification email
    await notifyEmailVerification({ user, verificationCode });

    res.status(201).json({
      message: 'Registration successful! Verification code sent.',
      email: user.email,
      verificationCode,
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Verify Email with 6-digit Code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.json({
        message: 'Email is already verified',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
          job_title: user.job_title
        }
      });
    }

    if (user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Mark verified
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    await user.save();

    res.json({
      message: 'Email successfully verified! Welcome to ClickUp.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        job_title: user.job_title
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Resend Verification Code
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Account is already verified' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    await notifyEmailVerification({ user, verificationCode });

    res.json({
      message: 'A new 6-digit verification code has been dispatched.',
      verificationCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    // Check verification status
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Email address is not verified yet.',
        requiresVerification: true,
        email: user.email,
        verificationCode: user.verificationCode
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        job_title: user.job_title
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
