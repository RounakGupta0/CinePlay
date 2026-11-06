const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendToken = require('../utils/sendToken');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    let { username, fullName, channelName, email, password, phoneNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // Determine username from username or fullName
    if (!username && fullName) {
      username = fullName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
    }
    if (!username || username.length < 3) {
      username = 'user_' + Math.random().toString(36).substring(2, 9);
    }

    channelName = channelName || fullName || username;

    // Check existing email
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check existing username, if exists append random suffix
    let usernameExists = await User.findOne({ username });
    if (usernameExists) {
      username = `${username}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      channelName,
      phoneNumber: phoneNumber || ''
    });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0B0B0B; color: #F8FAFC; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background: #171717; border-radius: 14px; padding: 40px; border: 1px solid rgba(214, 173, 98, 0.25); }
        .logo { font-size: 26px; font-weight: 700; color: #D6AD62; margin-bottom: 24px; letter-spacing: 2px; }
        h1 { color: #F8FAFC; font-size: 24px; font-family: Georgia, serif; margin-bottom: 16px; }
        p { color: #A1A1AA; line-height: 1.6; margin-bottom: 24px; font-size: 15px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #D6AD62, #E5BD75); color: #0B0B0B; padding: 14px 34px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 15px; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); color: #71717A; font-size: 13px; }
      </style></head>
      <body>
        <div class="container">
          <div class="logo">&#9654; CINEPLAY</div>
          <h1>Verify Your Membership</h1>
          <p>Welcome to CinePlay, <strong style="color:#F8FAFC">${channelName || username}</strong>. Please confirm your email address to activate your director pass and begin experiencing cinema.</p>
          <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          <div class="footer">
            <p>This verification link expires in 24 hours. If you did not create a CinePlay account, please disregard this transmission.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({ to: user.email, subject: 'CinePlay — Verify Your Email', html });
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } catch (emailErr) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
    }
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `This ${field} is already registered.` });
    }
    res.status(500).json({ success: false, message: err.message || 'Server error during registration.' });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:token
exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link. Please register again.' });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res, 'Email verified successfully! Welcome to CinePlay.');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during email verification.' });
  }
};

// @desc    Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    sendToken(user, 200, res, 'Logged in successfully.');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const html = `<p>Click <a href="${verificationUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`;
    await sendEmail({ to: user.email, subject: 'CinePlay — Resend Email Verification', html });

    res.json({ success: true, message: 'Verification email resent. Please check your inbox.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend verification email.' });
  }
};
