const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
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
    lcp: Number,
    lcpScore: Number,
    fcp: Number,
    fcpScore: Number,
    tbt: Number,
    tbtScore: Number,
    cls: Number,
    clsScore: Number,
    si: Number,
    siScore: Number,
    firstContentfulPaint: Number,
    largestContentfulPaint: Number,
    cumulativeLayoutShift: Number,
    speedIndex: Number,
    interactive: Number,
    totalBlockingTime: Number
  },
  seo: {
    score: Number,
    titleTag: {
      present: Boolean,
      length: Number,
      score: Number
    },
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
    https: Boolean,
    mobileFriendly: Boolean,
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
    htmlLang: Boolean,
    issues: [{
      title: String,
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }]
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

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
      },
      token
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
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
      },
      token
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

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
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

    // Simulate audit processing (replace with real Lighthouse later)
    setTimeout(async () => {
      try {
        // Mock audit results for now
        const mockResults = {
          status: 'completed',
          overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
          performance: {
            score: Math.floor(Math.random() * 40) + 60,
            firstContentfulPaint: Math.floor(Math.random() * 2000) + 800,
            largestContentfulPaint: Math.floor(Math.random() * 3000) + 1200,
            cumulativeLayoutShift: Math.random() * 0.2,
            speedIndex: Math.floor(Math.random() * 3000) + 1000,
            interactive: Math.floor(Math.random() * 4000) + 2000,
            totalBlockingTime: Math.floor(Math.random() * 500) + 100
          },
          seo: {
            score: Math.floor(Math.random() * 40) + 60,
            metaDescription: {
              present: Math.random() > 0.3,
              length: Math.floor(Math.random() * 100) + 50,
              score: Math.floor(Math.random() * 40) + 60
            },
            documentTitle: {
              present: Math.random() > 0.2,
              length: Math.floor(Math.random() * 50) + 20,
              score: Math.floor(Math.random() * 40) + 60
            },
            viewport: Math.random() > 0.1,
            isCrawlable: Math.random() > 0.2,
            robotsTxt: Math.random() > 0.3,
            canonical: Math.random() > 0.4,
            hreflang: Math.random() > 0.6
          },
          accessibility: {
            score: Math.floor(Math.random() * 40) + 60,
            colorContrast: Math.random() > 0.2,
            imageAlt: Math.random() > 0.3,
            linkText: Math.random() > 0.2,
            tapTargets: Math.random() > 0.1,
            headingOrder: Math.random() > 0.3,
            htmlLang: Math.random() > 0.2
          },
          bestPractices: {
            score: Math.floor(Math.random() * 40) + 60,
            usesHttps: Math.random() > 0.1,
            noVulnerableLibraries: Math.random() > 0.2,
            noConsoleErrors: Math.random() > 0.3,
            usesPassiveEventListeners: Math.random() > 0.4,
            noUnloadListeners: Math.random() > 0.2
          },
          images: {
            totalImages: Math.floor(Math.random() * 20) + 5,
            imagesWithAlt: Math.floor(Math.random() * 15) + 3,
            webpImages: Math.floor(Math.random() * 10) + 2,
            lazyLoadedImages: Math.floor(Math.random() * 8) + 1,
            usesOptimizedImages: Math.random() > 0.3,
            usesWebpImages: Math.random() > 0.4,
            usesResponsiveImages: Math.random() > 0.5
          },
          recommendations: [
            {
              title: 'Optimize Images',
              description: 'Convert images to WebP format for better compression',
              priority: 'medium',
              impact: 'Medium impact on page load speed',
              effort: 'Medium effort - requires image optimization'
            },
            {
              title: 'Improve Meta Description',
              description: 'Add or optimize meta description for better SEO',
              priority: 'high',
              impact: 'High impact on search engine visibility',
              effort: 'Low effort - simple HTML addition'
            }
          ],
          lighthouseVersion: '9.6.8',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          fetchTime: new Date().toISOString()
        };

        await Audit.findByIdAndUpdate(audit._id, mockResults);
        console.log(`✅ Mock audit completed for ${url} with score: ${mockResults.overallScore}`);
      } catch (error) {
        console.error(`❌ Mock audit failed for ${url}:`, error);
        await Audit.findByIdAndUpdate(audit._id, {
          status: 'failed',
          error: error.message
        });
      }
    }, 5000); // 5 second delay to simulate processing

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

    // Simulate audit processing (replace with real Lighthouse later)
    setTimeout(async () => {
      try {
        // Mock audit results for authenticated users (slightly better scores)
        const mockResults = {
          status: 'completed',
          overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
          performance: {
            score: Math.floor(Math.random() * 30) + 70,
            lcp: Math.floor(Math.random() * 2000) + 1000, // Largest Contentful Paint
            lcpScore: Math.floor(Math.random() * 30) + 70,
            fcp: Math.floor(Math.random() * 1500) + 600, // First Contentful Paint
            fcpScore: Math.floor(Math.random() * 30) + 70,
            tbt: Math.floor(Math.random() * 300) + 50, // Total Blocking Time
            tbtScore: Math.floor(Math.random() * 30) + 70,
            cls: Math.random() * 0.1, // Cumulative Layout Shift
            clsScore: Math.floor(Math.random() * 30) + 70,
            si: Math.floor(Math.random() * 2000) + 800, // Speed Index
            siScore: Math.floor(Math.random() * 30) + 70,
            firstContentfulPaint: Math.floor(Math.random() * 1500) + 600,
            largestContentfulPaint: Math.floor(Math.random() * 2000) + 1000,
            cumulativeLayoutShift: Math.random() * 0.1,
            speedIndex: Math.floor(Math.random() * 2000) + 800,
            interactive: Math.floor(Math.random() * 3000) + 1500,
            totalBlockingTime: Math.floor(Math.random() * 300) + 50,
            // Detailed performance issues
            largeImages: ['hero-image.jpg', 'banner.png', 'gallery-1.jpg'],
            renderBlocking: ['bootstrap.css', 'jquery.js', 'main.css'],
            unoptimizedFonts: ['Roboto', 'Open Sans', 'Lato'],
            largeCSS: ['bootstrap.css', 'custom.css', 'theme.css'],
            longTasks: ['analytics.js', 'tracking.js', 'chat-widget.js'],
            unusedJS: ['jquery.js', 'lodash.js', 'moment.js'],
            imagesWithoutDimensions: ['banner.jpg', 'logo.png', 'icon.svg'],
            dynamicContent: ['ads', 'social-widgets', 'newsletter-popup']
          },
          seo: {
            score: Math.floor(Math.random() * 30) + 70,
            titleTag: {
              present: Math.random() > 0.1,
              content: Math.random() > 0.1 ? 'Sample Page Title - Your Website' : '',
              length: Math.floor(Math.random() * 40) + 30,
              score: Math.floor(Math.random() * 30) + 70
            },
            metaDescription: {
              present: Math.random() > 0.2,
              content: Math.random() > 0.2 ? 'This is a sample meta description for the page' : '',
              length: Math.floor(Math.random() * 80) + 60,
              score: Math.floor(Math.random() * 30) + 70
            },
            documentTitle: {
              present: Math.random() > 0.1,
              length: Math.floor(Math.random() * 40) + 30,
              score: Math.floor(Math.random() * 30) + 70
            },
            https: Math.random() > 0.05,
            mobileFriendly: Math.random() > 0.1,
            viewport: Math.random() > 0.05,
            isCrawlable: Math.random() > 0.1,
            robotsTxt: Math.random() > 0.2,
            canonical: Math.random() > 0.3,
            hreflang: Math.random() > 0.5,
            // Heading structure analysis
            h1Present: Math.random() > 0.1,
            h1Count: Math.floor(Math.random() * 3) + 1,
            h2Count: Math.floor(Math.random() * 5) + 2,
            h3Count: Math.floor(Math.random() * 8) + 3
          },
          accessibility: {
            score: Math.floor(Math.random() * 30) + 70,
            colorContrast: Math.random() > 0.1,
            imageAlt: Math.random() > 0.2,
            linkText: Math.random() > 0.1,
            tapTargets: Math.random() > 0.05,
            headingOrder: Math.random() > 0.2,
            htmlLang: Math.random() > 0.1,
            issues: [
              {
                title: "Image elements do not have [alt] attributes",
                description: "Informative elements should aim for short, descriptive alternate text.",
                severity: Math.random() > 0.5 ? 'high' : 'medium'
              },
              {
                title: "Background and foreground colors do not have a sufficient contrast ratio",
                description: "Low-contrast text is difficult or impossible for many users to read.",
                severity: Math.random() > 0.7 ? 'high' : 'medium'
              }
            ].filter(() => Math.random() > 0.3)
          },
          bestPractices: {
            score: Math.floor(Math.random() * 30) + 70,
            usesHttps: Math.random() > 0.05,
            noVulnerableLibraries: Math.random() > 0.1,
            noConsoleErrors: Math.random() > 0.2,
            usesPassiveEventListeners: Math.random() > 0.3,
            noUnloadListeners: Math.random() > 0.1
          },
          images: {
            totalImages: Math.floor(Math.random() * 15) + 8,
            imagesWithAlt: Math.floor(Math.random() * 12) + 6,
            webpImages: Math.floor(Math.random() * 8) + 4,
            lazyLoadedImages: Math.floor(Math.random() * 6) + 3,
            usesOptimizedImages: Math.random() > 0.2,
            usesWebpImages: Math.random() > 0.3,
            usesResponsiveImages: Math.random() > 0.4,
            // Detailed image issues
            imagesWithoutAlt: Math.floor(Math.random() * 5) + 1,
            imagesWithoutAltList: [
              { src: 'hero-image.jpg', alt: null },
              { src: 'banner.png', alt: '' },
              { src: 'logo.svg', alt: null }
            ],
            unoptimizedImages: Math.floor(Math.random() * 3) + 1,
            unoptimizedImagesList: [
              { src: 'large-photo.jpg', size: '2.5MB', format: 'JPEG' },
              { src: 'banner.png', size: '1.8MB', format: 'PNG' },
              { src: 'gallery-1.jpg', size: '3.2MB', format: 'JPEG' }
            ]
          },
          recommendations: [
            {
              title: 'Optimize Images',
              description: 'Convert remaining images to WebP format',
              priority: 'low',
              impact: 'Small impact on page load speed',
              effort: 'Low effort - automated conversion available'
            },
            {
              title: 'Improve Meta Description',
              description: 'Enhance meta description for better SEO',
              priority: 'medium',
              impact: 'Medium impact on search engine visibility',
              effort: 'Low effort - content optimization'
            }
          ],
          lighthouseVersion: '9.6.8',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          fetchTime: new Date().toISOString()
        };

        const updatedAudit = await Audit.findByIdAndUpdate(audit._id, mockResults, { new: true });
        console.log(`✅ Mock authenticated audit completed for ${url} with score: ${mockResults.overallScore}`);
        console.log(`📊 Performance data saved:`, updatedAudit.performance);
      } catch (error) {
        console.error(`❌ Mock authenticated audit failed for ${url}:`, error);
        await Audit.findByIdAndUpdate(audit._id, {
          status: 'failed',
          error: error.message
        });
      }
    }, 3000); // 3 second delay for authenticated users

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

    // Get query parameters
    const { page = 1, limit = 10, status, deviceType, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter = { userId: user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (deviceType) {
      filter.deviceType = deviceType;
    }
    
    if (search) {
      filter.$or = [
        { url: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } }
      ];
    }

    // Get audits with filters and pagination
    const audits = await Audit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalAudits = await Audit.countDocuments(filter);
    const totalPages = Math.ceil(totalAudits / limitNum);

    res.status(200).json({
      success: true,
      total: totalAudits,
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      audits: audits.map(audit => ({
        _id: audit._id,
        url: audit.url,
        domain: audit.domain,
        status: audit.status,
        overallScore: audit.overallScore,
        createdAt: audit.createdAt,
        deviceType: audit.deviceType
      }))
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
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 MongoDB: ${MONGODB_URI}`);
});


