const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://karmasync.vercel.app',
    'https://karmasync-backend.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add preflight handler
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  w: 'majority'
};

// Add connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connecting', () => {
  console.log('MongoDB connecting...');
});

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.error('MongoDB URI is not defined in environment variables');
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Log connection attempt (without sensitive data)
    const uriParts = process.env.MONGODB_URI.split('@');
    console.log('Connecting to MongoDB cluster:', uriParts[1]?.split('/')[0] || 'unknown');

    // Try to connect with explicit error handling
    try {
      await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
      console.log('Connected to MongoDB successfully');
      console.log('Connection state:', mongoose.connection.readyState);
      console.log('Database name:', mongoose.connection.name);
    } catch (connectError) {
      console.error('MongoDB connection error details:', {
        name: connectError.name,
        message: connectError.message,
        code: connectError.code,
        stack: connectError.stack
      });
      throw connectError;
    }
    
  } catch (err) {
    console.error('MongoDB connection error:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // Log additional connection details
    console.log('Connection attempt details:', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      options: mongooseOptions
    });
    
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Load routes
console.log('Loading routes...');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const todosRoutes = require('./routes/todosRoutes');
const userRoutes = require('./routes/users');

// Register routes
console.log('Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const connectionState = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(200).json({ 
    status: 'ok',
    database: {
      status: dbStatus,
      state: connectionState[mongoose.connection.readyState],
      readyState: mongoose.connection.readyState
    }
  });
});

// Test endpoint for MongoDB connection
app.get('/api/test-db', (req, res) => {
  try {
    // Basic response first
    res.json({
      message: 'API endpoint is working',
      timestamp: new Date().toISOString(),
      connection: {
        state: mongoose.connection.readyState,
        hasUri: !!process.env.MONGODB_URI,
        env: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Add a basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Add a detailed database health check endpoint
app.get('/api/db-health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const connectionInfo = {
      status: dbState === 1 ? 'connected' : 'disconnected',
      state: dbState,
      details: {
        hasUri: !!process.env.MONGODB_URI,
        env: process.env.NODE_ENV,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        uriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
        uriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : null,
        connectionState: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      },
      timestamp: new Date().toISOString()
    };

    // Try to get more information about the connection
    try {
      if (dbState === 1) {
        const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        connectionInfo.serverStatus = {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections
        };
      }
    } catch (statusError) {
      connectionInfo.statusError = statusError.message;
    }

    console.log('Database health check:', connectionInfo);
    res.json(connectionInfo);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: {
        state: mongoose.connection.readyState,
        hasUri: !!process.env.MONGODB_URI,
        error: error.toString(),
        stack: error.stack
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// For local development
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// Export for Vercel
module.exports = app;
