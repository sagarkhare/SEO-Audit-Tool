const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LighthouseAuditService = require('./services/lighthouseAuditService');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seo-audit-tool';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random-123456789';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    auditsThisMonth: {
      type: Number,
      default: 0
    },
    maxAuditsPerMonth: {
      type: Number,
      default: 10
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Audit Schema
const auditSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile'],
    default: 'desktop'
  },
  location: {
    type: String,
    default: 'us'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  overallScore: Number,
  performance: {
    score: Number,
    firstContentfulPaint: Number,
    largestContentfulPaint: Number,
    cumulativeLayoutShift: Number,
    speedIndex: Number,
    interactive: Number,
    totalBlockingTime: Number
  },
  seo: {
    score: Number,
    metaDescription: {
      present: Boolean,
      length: Number,
      score: Number
    },
    documentTitle: {
      present: Boolean,
      length: Number,
      score: Number
    },
    viewport: Boolean,
    isCrawlable: Boolean,
    robotsTxt: Boolean,
    canonical: Boolean,
    hreflang: Boolean
  },
  accessibility: {
    score: Number,
    colorContrast: Boolean,
    imageAlt: Boolean,
    linkText: Boolean,
    tapTargets: Boolean,
    headingOrder: Boolean,
    htmlLang: Boolean
  },
  bestPractices: {
    score: Number,
    usesHttps: Boolean,
    noVulnerableLibraries: Boolean,
    noConsoleErrors: Boolean,
    usesPassiveEventListeners: Boolean,
    noUnloadListeners: Boolean
  },
  images: {
    totalImages: Number,
    imagesWithAlt: Number,
    webpImages: Number,
    lazyLoadedImages: Number,
    usesOptimizedImages: Boolean,
    usesWebpImages: Boolean,
    usesResponsiveImages: Boolean
  },
  lighthouseVersion: String,
  userAgent: String,
  fetchTime: String,
  error: String,
  recommendations: [{
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    impact: String,
    effort: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Audit = mongoose.model('Audit', auditSchema);

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      subscription: {
        type: 'free',
        auditsThisMonth: 0,
        maxAuditsPerMonth: 10
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Anonymous audit routes
app.post('/api/audit/anonymousAudit', async (req, res) => {
  try {
    const { url, deviceType = 'desktop', location = 'us' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Create audit record
    const audit = new Audit({
      url,
      domain: new URL(url).hostname,
      status: 'processing',
      isPublic: true,
      deviceType,
      location
    });

    await audit.save();

    // Start real Lighthouse audit in background
    const lighthouseService = new LighthouseAuditService();
    
    // Run audit asynchronously
    lighthouseService.runAudit(url, { deviceType, location })
      .then(async (auditResults) => {
        // Update audit with real results
        await Audit.findByIdAndUpdate(audit._id, {
          status: 'completed',
          overallScore: auditResults.overallScore,
          performance: auditResults.performance,
          seo: auditResults.seo,
          accessibility: auditResults.accessibility,
          bestPractices: auditResults.bestPractices,
          images: auditResults.images,
          recommendations: auditResults.recommendations,
          lighthouseVersion: auditResults.lighthouseVersion,
          userAgent: auditResults.userAgent,
          fetchTime: auditResults.fetchTime
        });
        
        console.log(`✅ Audit completed for ${url} with score: ${auditResults.overallScore}`);
      })
      .catch(async (error) => {
        console.error(`❌ Audit failed for ${url}:`, error);
        await Audit.findByIdAndUpdate(audit._id, {
          status: 'failed',
          error: error.message
        });
      });

    res.status(201).json({
      success: true,
      message: 'Anonymous audit started successfully',
      audit: {
        _id: audit._id,
        url: audit.url,
        domain: audit.domain,
        status: audit.status,
        createdAt: audit.createdAt,
        deviceType: audit.deviceType,
        isPublic: audit.isPublic
      }
    });

  } catch (error) {
    console.error('Anonymous audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/audit/anonymousAudit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const audit = await Audit.findById(id);
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    if (!audit.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This audit requires authentication'
      });
    }

    // Return real audit data from database
    const auditData = {
      _id: audit._id,
      url: audit.url,
      domain: audit.domain,
      status: audit.status,
      createdAt: audit.createdAt,
      deviceType: audit.deviceType,
      isPublic: audit.isPublic,
      overallScore: audit.overallScore,
      performance: audit.performance,
      seo: audit.seo,
      accessibility: audit.accessibility,
      bestPractices: audit.bestPractices,
      images: audit.images,
      recommendations: audit.recommendations,
      lighthouseVersion: audit.lighthouseVersion,
      userAgent: audit.userAgent,
      fetchTime: audit.fetchTime,
      error: audit.error
    };

    res.status(200).json({
      success: true,
      audit: auditData
    });

  } catch (error) {
    console.error('Get anonymous audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Authenticated audit routes
app.post('/api/audit', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const { url, deviceType = 'desktop', location = 'us' } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required' 
      });
    }
    
    // Create audit record
    const audit = new Audit({
      url,
      domain: new URL(url).hostname,
      userId: user._id,
      deviceType,
      location,
      status: 'processing',
      isPublic: false
    });

    await audit.save();

    // Start real Lighthouse audit in background
    const lighthouseService = new LighthouseAuditService();
    
    // Run audit asynchronously
    lighthouseService.runAudit(url, { deviceType, location })
      .then(async (auditResults) => {
        // Update audit with real results
        await Audit.findByIdAndUpdate(audit._id, {
          status: 'completed',
          overallScore: auditResults.overallScore,
          performance: auditResults.performance,
          seo: auditResults.seo,
          accessibility: auditResults.accessibility,
          bestPractices: auditResults.bestPractices,
          images: auditResults.images,
          recommendations: auditResults.recommendations,
          lighthouseVersion: auditResults.lighthouseVersion,
          userAgent: auditResults.userAgent,
          fetchTime: auditResults.fetchTime
        });
        
        console.log(`✅ Authenticated audit completed for ${url} with score: ${auditResults.overallScore}`);
      })
      .catch(async (error) => {
        console.error(`❌ Authenticated audit failed for ${url}:`, error);
        await Audit.findByIdAndUpdate(audit._id, {
          status: 'failed',
          error: error.message
        });
      });

    res.status(201).json({
      success: true,
      message: 'Authenticated audit started successfully',
      audit: {
        _id: audit._id,
        url: audit.url,
        domain: audit.domain,
        deviceType: audit.deviceType,
        location: audit.location,
        status: audit.status,
        userId: audit.userId,
        createdAt: audit.createdAt
      }
    });

  } catch (error) {
    console.error('Authenticated audit error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

app.get('/api/audit/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const { id } = req.params;
    
    const audit = await Audit.findOne({ _id: id, userId: user._id });
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Return real audit data from database
    const auditData = {
      _id: audit._id,
      url: audit.url,
      domain: audit.domain,
      status: audit.status,
      userId: audit.userId,
      createdAt: audit.createdAt,
      overallScore: audit.overallScore,
      performance: audit.performance,
      seo: audit.seo,
      accessibility: audit.accessibility,
      bestPractices: audit.bestPractices,
      images: audit.images,
      recommendations: audit.recommendations,
      lighthouseVersion: audit.lighthouseVersion,
      userAgent: audit.userAgent,
      fetchTime: audit.fetchTime,
      error: audit.error
    };

    res.status(200).json({
      success: true,
      audit: auditData
    });

  } catch (error) {
    console.error('Get authenticated audit error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get user's audit history
app.get('/api/audit', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const audits = await Audit.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id url domain status overallScore createdAt');

    res.status(200).json({
      success: true,
      audits,
      total: audits.length
    });

  } catch (error) {
    console.error('Get audit history error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SEO Audit Tool API is running',
    database: 'MongoDB Connected',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'SEO Audit Tool API',
    version: '1.0.0',
    status: 'running',
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: MongoDB`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
