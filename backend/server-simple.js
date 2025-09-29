const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false, // Disable trust proxy for local development
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple audit routes for testing
app.post('/api/audit/anonymous', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required'
    });
  }

  // Create a mock audit response
  const mockAudit = {
    _id: 'mock-audit-' + Date.now(),
    url: url,
    domain: new URL(url).hostname,
    status: 'processing',
    createdAt: new Date(),
    deviceType: 'desktop',
    isPublic: true
  };

  res.status(201).json({
    success: true,
    message: 'Anonymous audit started successfully',
    audit: mockAudit
  });
});

app.get('/api/audit/anonymous/:id', (req, res) => {
  const { id } = req.params;
  
  // Create a mock completed audit
  const mockAudit = {
    _id: id,
    url: 'https://example.com',
    domain: 'example.com',
    status: 'completed',
    createdAt: new Date(),
    deviceType: 'desktop',
    isPublic: true,
    overallScore: 85,
    performance: {
      score: 90,
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2100,
      cumulativeLayoutShift: 0.1
    },
    metaTags: {
      title: {
        present: true,
        length: 45,
        score: 85
      },
      description: {
        present: true,
        length: 140,
        score: 90
      }
    },
    images: {
      totalImages: 5,
      imagesWithAlt: 4,
      webpImages: 2,
      lazyLoadedImages: 3
    },
    recommendations: [
      {
        title: 'Optimize Images',
        description: 'Convert images to WebP format for better compression',
        priority: 'medium',
        impact: 'Medium impact on page load speed',
        effort: 'Medium effort - requires image optimization'
      }
    ]
  };

  res.status(200).json({
    success: true,
    audit: mockAudit
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SEO Audit Tool API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'SEO Audit Tool API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
