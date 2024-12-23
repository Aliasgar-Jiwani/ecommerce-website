const express = require('express');
const User = require('../models/user');
const router = express.Router();
const bcrypt = require('bcrypt');

// Check Auth Status Route
router.get('/check-auth', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking authentication'
        });
    }
});

// Check auth status
router.get('/check', async (req, res) => {
    try {
        console.log('Auth check request. Session:', req.session);
        if (!req.session.userId) {
            console.log('No user ID in session');
            return res.json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const user = await User.findById(req.session.userId);
        console.log('Found user:', user ? user.email : 'none');
        
        if (!user) {
            console.log('User not found in database');
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        // Return user data without sensitive information
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking authentication status'
        });
    }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create a new user
    const userId = require('crypto').randomBytes(8).toString('hex'); // Generate unique user ID
    const user = new User({ name, email, password, userId, phone });
    await user.save();

    // Store user info in session
    req.session.userId = user._id;

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Store user info in session
        req.session.userId = user._id;
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                }
                resolve();
            });
        });

        console.log('Login successful. Session ID:', req.session.id);
        console.log('User ID in session:', req.session.userId);

        // Respond with success
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error during login' 
        });
    }
});

router.post('/logout', (req, res) => {
    if (!req.session.userId) {
        return res.json({
            success: true,
            message: 'Already logged out'
        });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error logging out' 
            });
        }
        res.clearCookie('connect.sid');
        res.json({ 
            success: true, 
            message: 'Logout successful' 
        });
    });
});

router.get('/status', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ isAuthenticated: false });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.json({ isAuthenticated: false });
    }

    res.json({
      isAuthenticated: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Error checking authentication status' });
  }
});

// Seller routes
router.post('/seller/signup', async (req, res) => {
  try {
    const { phoneNumber, emailId, password, name, businessName, businessAddress, businessType } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email: emailId });
    if (existingSeller) {
      return res.status(400).json({ error: 'Seller already exists' });
    }

    // Generate unique seller ID (MBSLR + 5 digits)
    let sellerId;
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      sellerId = `MBSLR${randomNum}`;
      const existingId = await Seller.findOne({ sellerId });
      if (!existingId) isUnique = true;
    }

    // Create new seller
    const seller = new Seller({
      name,
      phoneNumber,
      email: emailId,
      password,
      sellerId,
      businessName,
      businessAddress, 
      businessType,
      emailVerified: false,
      phoneVerified: false
    });

    await seller.save();

    // Store sellerId in session
    req.session.sellerId = seller._id;

    res.status(201).json({ 
      success: true,
      message: 'Seller registered successfully',
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error registering seller' });
  }
});

router.post('/seller/login', async (req, res) => {
  try {
    const { sellerId, emailOrPhone, password } = req.body;

    // Find seller by ID and email/phone
    const seller = await Seller.findOne({
      sellerId,
      $or: [
        { email: emailOrPhone },
        { phoneNumber: emailOrPhone }
      ]
    });

    if (!seller) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Store sellerId in session
    req.session.sellerId = seller._id;

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

router.post('/seller/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Error logging out' });
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Seller logout successful' });
  });
});

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.status(200).json(seller);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching seller details' });
  }
});

module.exports = router;
