import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendOtpEmail } from "../utils/email.js";
import bcrypt from "bcryptjs";
import { deleteOldImage } from '../config/multerConfig.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, fullName, role } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phoneNumber,
      role: role || 'player'
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        coinBalance: user.coinBalance,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('User found:', user);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials (user not found)' });
    }

    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials (password mismatch)' });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        coinBalance: user.coinBalance,
        lastLogin: user.lastLogin,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log('\n📝 ===== PROFILE UPDATE REQUEST =====');
    console.log('User ID:', req.user._id);
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.filename : 'No file');
    
    const { fullName, phoneNumber, username } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('❌ User not found:', req.user._id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        console.log('❌ Username already taken:', username);
        return res.status(400).json({ 
          success: false, 
          message: 'Username is already taken' 
        });
      }
      user.username = username;
    }

    // Update text fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    // Handle profile image upload
    if (req.file) {
      console.log('New profile image uploaded:', req.file.filename);
      
      // Delete old image if exists
      if (user.profileImage) {
        deleteOldImage(user.profileImage);
      }
      
      // Save new image path
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    console.log('✅ Profile updated successfully for user:', user.username);
    console.log('Updated fields:', {
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      username: user.username,
      profileImage: user.profileImage
    });
    console.log('===== END PROFILE UPDATE =====\n');

    // Return updated user data (excluding password)
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePushToken = async (req, res) => {
  try {
    console.log('\n🔔 ===== PUSH TOKEN UPDATE REQUEST =====');
    console.log('User ID:', req.user._id);
    console.log('User email:', req.user.email);
    console.log('Request body:', req.body);
    console.log('Push token received:', req.body.pushToken);
    console.log('Token length:', req.body.pushToken?.length);
    console.log('Token format valid:', req.body.pushToken?.startsWith('ExponentPushToken['));
    
    const { pushToken } = req.body;
    
    if (!pushToken) {
      console.log('❌ No push token in request body');
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('❌ User not found:', req.user._id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('Before update - user.pushToken:', user.pushToken);
    
    user.pushToken = pushToken;
    await user.save();

    console.log('After update - user.pushToken:', user.pushToken);
    console.log(`✅ Push token updated for user: ${user.username} (${user.email})`);
    console.log(`📱 Token: ${pushToken}`);
    console.log('===== END PUSH TOKEN UPDATE =====\n');

    res.json({
      success: true,
      message: 'Push token updated successfully',
      pushToken: user.pushToken
    });
  } catch (error) {
    console.error('❌ Error updating push token:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const otpStore = {};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    await sendOtpEmail(email, otp);

    res.status(200).json({ 
      success: true, 
      message: "OTP sent to your email" 
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send OTP. Please try again." 
    });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, OTP, and new password are required" 
      });
    }

    const otpData = otpStore[email];
    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP not found or expired" 
      });
    }

    if (otpData.expires < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ 
        success: false, 
        message: "OTP expired. Please request a new one." 
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne({ email }, { password: hashedPassword });
    delete otpStore[email];

    res.status(200).json({ 
      success: true, 
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("Error in resetPasswordWithOtp:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset password. Please try again." 
    });
  }
};