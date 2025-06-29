const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Debug environment variables
console.log('🔍 Environment Variables Debug:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 'Using default 5000');

const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const roadmapRoutes = require('./routes/roadmap');
const mentorRoutes = require('./routes/mentor');
const resourcesRoutes = require('./routes/resources');
const dashboardRoutes = require('./routes/dashboard');

const { authenticateToken } = require('./middleware/auth');
const { setupSocketHandlers } = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careerpath-ai';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development-only';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fallback-openai-key';

// Set environment variables for other modules
process.env.JWT_SECRET = JWT_SECRET;
process.env.OPENAI_API_KEY = OPENAI_API_KEY;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', authenticateToken, skillsRoutes);
app.use('/api/roadmap', authenticateToken, roadmapRoutes);
app.use('/api/mentor', authenticateToken, mentorRoutes);
app.use('/api/resources', authenticateToken, resourcesRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CareerPath AI Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io setup
setupSocketHandlers(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 CareerPath AI Server running on port ${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 JWT_SECRET loaded: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
  console.log(`🗄️ MONGODB_URI loaded: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
});

module.exports = { app, server, io }; 