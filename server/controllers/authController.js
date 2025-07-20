const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Todo = require('../models/Todo');
const Project = require('../models/project.model');
const Task = require('../models/task.model');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log('\n=== Environment Variables ===');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

console.log('Checking email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to KarmaSync!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2c3e50;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f0f2f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              padding: 35px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
              font-weight: 600;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .content {
              padding: 35px;
              background: linear-gradient(to bottom, #ffffff, #f8f9fa);
            }
            .welcome-text {
              font-size: 18px;
              color: #2c3e50;
              margin-bottom: 25px;
              font-weight: 500;
            }
            .feature-list {
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              border-radius: 10px;
              padding: 25px;
              margin: 25px 0;
              border: 1px solid #e0e0e0;
            }
            .feature-list h3 {
              color: #4a90e2;
              margin-top: 0;
              font-size: 20px;
            }
            .feature-list li {
              margin-bottom: 15px;
              color: #34495e;
              padding-left: 5px;
            }
            .footer {
              background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
              padding: 25px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 12px;
            }
            .copyright {
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
          <div class="header">
            <h1>Welcome to KarmaSync!</h1>
          </div>
          <div class="content">
              <p class="welcome-text">Hello ${user.fullName},</p>
            <p>Welcome to KarmaSync - Your Collaborative Workspace for Smarter Project Management!</p>
              <p>KarmaSync is a modern, lightweight project management tool built for teams and individuals to stay organized, productive, and in sync.</p>
            
              <div class="feature-list">
            <h3>🚀 Key Features</h3>
                <ul style="list-style-type: none; padding-left: 0;">
              <li>📁 Create and manage multiple projects</li>
                  <li>👥 Collaborate with team members via roles</li>
                  <li>🗂️ Track tasks in a visual Kanban board</li>
                  <li>🧩 Assign tasks with deadlines and comments</li>
                  <li>📝 Maintain a personal daily to-do list</li>
            </ul>
              </div>
            
            <p>We're excited to have you on board! If you have any questions or need assistance, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
              <div class="copyright">© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</div>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  resetPassword: (user, resetUrl) => ({
    subject: 'Reset Your KarmaSync Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2c3e50;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f0f2f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              padding: 35px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
              font-weight: 600;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .content {
              padding: 35px;
              background: linear-gradient(to bottom, #ffffff, #f8f9fa);
            }
            .warning {
              background: linear-gradient(135deg, #fff3cd, #ffeeba);
              border: 1px solid #ffeeba;
              color: #856404;
              padding: 20px;
              border-radius: 10px;
              margin: 25px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .warning ul {
              margin: 15px 0;
              padding-left: 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 500;
              margin: 25px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-1px);
            }
            .footer {
              background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
              padding: 25px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 12px;
            }
            .copyright {
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
              <p>Hello ${user.fullName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
          </div>
          <div class="footer">
              <div class="copyright">© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</div>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  projectCollaboration: (project, collaborator, creator) => ({
    subject: `You've been added to a project: ${project.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2c3e50;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f0f2f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              padding: 35px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
              font-weight: 600;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .content {
              padding: 35px;
              background: linear-gradient(to bottom, #ffffff, #f8f9fa);
            }
            .project-details {
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              border-radius: 10px;
              padding: 25px;
              margin: 25px 0;
              border: 1px solid #e0e0e0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .role-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 500;
              margin-top: 10px;
              background: linear-gradient(135deg, #4a90e2, #7f53ac);
              color: white;
            }
            .footer {
              background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
              padding: 25px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            .copyright {
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Project Collaboration Invitation</h1>
            </div>
            <div class="content">
              <p>Hello ${collaborator.fullName},</p>
              
              <p>You've been added to a new project on KarmaSync!</p>
              
              <div class="project-details">
                <h3>Project Details</h3>
                <p><strong>Project Name:</strong> ${project.title}</p>
                <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
                <p><strong>Added by:</strong> ${creator.fullName} (${creator.username})</p>
                <p><strong>Your Role:</strong> <span class="role-badge">${collaborator.role === 'manager' ? 'Project Manager' : 'Developer'}</span></p>
              </div>

              <p>You can now access the project and start collaborating with your team members.</p>
              
              <p>—<br>The KarmaSync Team</p>
            </div>
            <div class="footer">
              <div class="copyright">© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</div>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

const tempUserData = new Map();

exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    console.log('Checking username availability:', username);

    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
      console.error('Connection details:', {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port
      });
      return res.status(503).json({ 
        message: 'Database connection is not available. Please try again in a moment.',
        details: {
          state: mongoose.connection.readyState,
          error: 'Database connection not established',
          retryAfter: 10 
        }
      });
    }

    if (!username || username.length < 3) {
      return res.status(400).json({ 
        available: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    if (username.length > 20) {
      return res.status(400).json({
        available: false,
        message: 'Username cannot be more than 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        available: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    const queryOptions = {
      maxTimeMS: 5000,
      readPreference: 'primaryPreferred'
    };

    const existingUser = await User.findOne({ username: username }, null, queryOptions);
    
    res.json({
      available: !existingUser,
      message: existingUser ? 'Username is already taken' : 'Username is available'
    });
  } catch (error) {
    console.error('Error checking username:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    if (error.name === 'MongoServerSelectionError' || 
        error.name === 'MongoNetworkError' || 
        error.name === 'MongoTimeoutError') {
      res.status(503).json({ 
        message: 'Database connection is not available. Please try again in a moment.',
        details: {
          error: error.name,
          message: error.message
        }
      });
    } else {
      res.status(500).json({ 
        message: 'Server error while checking username',
        details: {
          error: error.name,
          message: error.message
        }
      });
    }
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Checking email availability:', email);

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({
        available: false,
        message: 'Please enter a valid email address'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      available: !existingUser,
      message: existingUser ? 'Email is already registered' : 'Email is available'
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Server error while checking email' });
  }
};

exports.signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    tempUserData.set(email, {
      fullName,
      username,
      email,
      password,
      otp,
      otpExpiry
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
        subject: 'Verify Your Email - KarmaSync',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                color: #2c3e50;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                background-color: #f0f2f5;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
                }
                .header {
                background: linear-gradient(135deg, #4a90e2, #7f53ac);
                padding: 35px 20px;
                  text-align: center;
                }
                .header h1 {
                color: #ffffff;
                  margin: 0;
                font-size: 28px;
                font-weight: 600;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }
                .content {
                padding: 35px;
                background: linear-gradient(to bottom, #ffffff, #f8f9fa);
              }
              .otp-container {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 10px;
                padding: 25px;
                text-align: center;
                margin: 25px 0;
                border: 1px solid #e0e0e0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .otp-code {
                font-size: 36px;
                  font-weight: bold;
                background: linear-gradient(135deg, #4a90e2, #7f53ac);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: 8px;
                margin: 15px 0;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }
                .footer {
                background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
                padding: 25px;
                  text-align: center;
                border-top: 1px solid #e0e0e0;
              }
              .copyright {
                color: #6c757d;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
            <div class="container">
              <div class="header">
                <h1>Verify Your Email</h1>
              </div>
              <div class="content">
                <p>Thank you for signing up with KarmaSync! To complete your registration, please use the following OTP to verify your email address:</p>
                
                <div class="otp-container">
                <div class="otp-code">${otp}</div>
                </div>

                <p style="color: #6c757d; font-size: 14px;">
                  This OTP will expire in 5 minutes. If you didn't request this verification, please ignore this email.
                </p>
              </div>
              <div class="footer">
                <div class="copyright">© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</div>
              </div>
              </div>
            </body>
          </html>
        `
      };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'OTP sent successfully. Please check your email to verify your account.',
      email
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error in signup process' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const userData = tempUserData.get(email);

    if (!userData) {
      return res.status(400).json({ message: 'Invalid or expired OTP request' });
    }

    if (userData.otp !== otp || userData.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const newUser = new User({
      fullName: userData.fullName,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      isVerified: true
    });

    await newUser.save();

    tempUserData.delete(email);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to KarmaSync!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #2c3e50;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f0f2f5;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                .header {
                  background: linear-gradient(135deg, #4a90e2, #7f53ac);
                  padding: 35px 20px;
                  text-align: center;
                }
                .header h1 {
                  color: #ffffff;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }
                .content {
                  padding: 35px;
                  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
                }
                .feature-list {
                  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                  border-radius: 10px;
                  padding: 25px;
                  margin: 25px 0;
                  border: 1px solid #e0e0e0;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .feature-item {
                  margin: 15px 0;
                  font-size: 16px;
                  color: #2c3e50;
                }
                .footer {
                  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
                  padding: 25px;
                  text-align: center;
                  border-top: 1px solid #e0e0e0;
                }
                .logo {
                  font-size: 28px;
                  font-weight: bold;
                  background: linear-gradient(135deg, #4a90e2, #7f53ac);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  margin-bottom: 12px;
                }
                .copyright {
                  color: #6c757d;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
              <div class="header">
                  <h1>Welcome to Karma Sync! 🌟</h1>
              </div>
              <div class="content">
                  <p>We're excited to have you on board!</p>
                  
                  <p>Karma Sync is your all-in-one productivity hub designed to help you stay organized, whether you're working solo or collaborating with a team.</p>
                  
                  <div class="feature-list">
                    <p><strong>Here's what you can do:</strong></p>
                    <div class="feature-item">🧍‍♂️ Personal Project Management – Plan, track, and manage your own projects with a clean Kanban workflow.</div>
                    <div class="feature-item">👥 Collaborative Project Management – Work with teammates, assign roles, and move tasks forward together.</div>
                    <div class="feature-item">✅ Personal Todos – Stay on top of your day-to-day priorities with a focused and flexible todo list.</div>
                </div>

                  <p>Let's get started and turn your tasks into accomplishments 🚀</p>
                  
                  <p>—<br>The Karma Sync Team</p>
              </div>
              <div class="footer">
                  <div class="copyright">© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</div>
                </div>
              </div>
            </body>
          </html>
        `
      };

    await transporter.sendMail(mailOptions);

    // Generate JWT token for the newly verified user
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      message: 'Email verified successfully. Welcome to KarmaSync!',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Error in OTP verification process' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const userData = tempUserData.get(email);

    if (!userData) {
      return res.status(400).json({ message: 'No pending verification found for this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    tempUserData.set(email, {
      ...userData,
      otp,
      otpExpiry
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New OTP for Email Verification - KarmaSync',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">New OTP for KarmaSync</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Here is your new OTP to verify your email address:
          </p>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            This OTP will expire in 5 minutes. If you didn't request this verification, please ignore this email.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.
            </p>
                </div>
              </div>
      `
      };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'New OTP sent successfully. Please check your email.',
      email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Error in resending OTP' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Please provide both identifier (email/username) and password'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Error during login'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request received for email:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ message: 'No account found with this email' });
    }

    console.log('User found:', user.username);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    console.log('Reset token saved for user:', user.username);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    const resetEmail = emailTemplates.resetPassword(user, resetUrl);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: resetEmail.subject,
        html: resetEmail.html
      });
      console.log('Reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      throw new Error('Failed to send reset email');
    }

    res.json({ message: 'Password reset instructions sent to your email. Please check your spam folder if you don\'t see it in your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Error processing password reset'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('Reset password request received for token:', token);

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      console.log('New password is same as current password');
      return res.status(400).json({ message: 'New password must be different from your current password' });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    console.log('Password reset successful for user:', user.email);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: error.message || 'Error resetting password'
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    console.log('getCurrentUser - Request headers:', req.headers);
    console.log('getCurrentUser - User from request:', req.user);
    
    const userId = req.user.userId || req.user.id;
    console.log('getCurrentUser - User ID:', userId);
    
    const user = await User.findById(userId).select('-password');
    console.log('getCurrentUser - Found user:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName
    } : 'No user found');

    if (!user) {
      console.log('getCurrentUser - No user found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('getCurrentUser - Error:', error);
    console.error('getCurrentUser - Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log('updateProfile - Request body:', req.body);
    console.log('updateProfile - User from request:', req.user);
    
    const { fullName, username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.userId || req.user.id;
    console.log('updateProfile - User ID:', userId);

    const user = await User.findById(userId);
    console.log('updateProfile - Found user:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName
    } : 'No user found');

    if (!user) {
      console.log('updateProfile - No user found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    let isModified = false;

    if (username && username !== user.username) {
      console.log('updateProfile - Checking username:', username);
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        console.log('updateProfile - Username already taken:', username);
        return res.status(400).json({ message: 'Username is already taken' });
      }
      console.log('updateProfile - Updating username from', user.username, 'to', username);
      user.username = username;
      isModified = true;
    }

    if (email && email !== user.email) {
      console.log('updateProfile - Checking email:', email);
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        console.log('updateProfile - Email already registered:', email);
        return res.status(400).json({ message: 'Email is already registered' });
      }
      console.log('updateProfile - Updating email from', user.email, 'to', email);
      user.email = email;
      isModified = true;
    }

    if (fullName && fullName !== user.fullName) {
      console.log('updateProfile - Updating full name from', user.fullName, 'to', fullName);
      user.fullName = fullName;
      isModified = true;
    }

    if (newPassword) {
      console.log('updateProfile - Password update requested');
      if (!currentPassword) {
        console.log('updateProfile - Current password not provided');
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      console.log('updateProfile - Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('updateProfile - Current password is incorrect');
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      console.log('updateProfile - Updating password');
      user.password = newPassword;
      isModified = true;
    }

    if (isModified) {
      console.log('updateProfile - Saving changes to database');
      await user.save();
      console.log('updateProfile - User saved successfully');
    } else {
      console.log('updateProfile - No changes detected');
    }

    res.json({
      message: isModified ? 'Profile updated successfully' : 'No changes made',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('updateProfile - Error:', error);
    console.error('updateProfile - Error stack:', error.stack);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    console.log('deleteAccount - Request received');
    const userId = req.user.userId || req.user.id;
    console.log('deleteAccount - User ID:', userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log('deleteAccount - No user found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Todo.deleteMany({ userId }, { session });
      console.log('deleteAccount - Deleted user todos');

      const projects = await Project.find({
        $or: [
          { createdBy: userId },
          { 'collaborators.userId': userId }
        ]
      }, { _id: 1 }, { session });

      const projectIds = projects.map(p => p._id);
      await Task.deleteMany({ projectId: { $in: projectIds } }, { session });
      console.log('deleteAccount - Deleted project tasks');

      await Project.deleteMany({ createdBy: userId }, { session });
      console.log('deleteAccount - Deleted user projects');

      await Project.updateMany(
        { 'collaborators.userId': userId },
        { $pull: { collaborators: { userId } } },
        { session }
      );
      console.log('deleteAccount - Removed user from project collaborations');

      await User.findByIdAndDelete(userId, { session });
      console.log('deleteAccount - Deleted user account');

      await session.commitTransaction();
      console.log('deleteAccount - Transaction committed successfully');

      res.json({ message: 'Account and all associated data deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('deleteAccount - Error:', error);
    console.error('deleteAccount - Error stack:', error.stack);
    res.status(500).json({ message: 'Error deleting account' });
  }
}; 

module.exports.emailTemplates = emailTemplates;
module.exports.transporter = transporter; 