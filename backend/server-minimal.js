const express = require('express');
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

// Mock user database (in production, use MongoDB)
const users = [];

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

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
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      subscription: {
        type: 'free',
        auditsThisMonth: 0,
        maxAuditsPerMonth: 10
      }
    };

    users.push(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

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
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

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

app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(user => user.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

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

// Simple audit routes for testing
app.post('/api/audit/anonymousAudit', (req, res) => {
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

app.get('/api/audit/anonymousAudit/:id', (req, res) => {
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

// Authenticated audit routes (require JWT token)
app.post('/api/audit', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(user => user.id === decoded.userId);
    
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
    
    // Simulate authenticated audit processing
    const auditId = `auth-audit-${Date.now()}`;
    res.status(201).json({
      success: true,
      message: 'Authenticated audit started successfully',
      audit: {
        _id: auditId,
        url,
        domain: new URL(url).hostname,
        deviceType,
        location,
        status: 'processing',
        userId: user.id,
        createdAt: new Date().toISOString()
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

app.get('/api/audit/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(user => user.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const { id } = req.params;
    
    // Simulate completed authenticated audit
    res.status(200).json({
      success: true,
      audit: {
        _id: id,
        url: 'https://example.com',
        domain: 'example.com',
        status: 'completed',
        userId: user.id,
        createdAt: new Date().toISOString(),
        overallScore: 92,
        performance: {
          score: 95,
          firstContentfulPaint: 800,
          largestContentfulPaint: 1500,
          cumulativeLayoutShift: 0.02
        },
        metaTags: {
          title: {
            present: true,
            length: 50,
            score: 95
          },
          description: {
            present: true,
            length: 155,
            score: 95
          }
        },
        images: {
          totalImages: 8,
          imagesWithAlt: 8,
          webpImages: 6,
          lazyLoadedImages: 5
        },
        recommendations: [
          {
            title: 'Optimize Images',
            description: 'Convert remaining images to WebP format',
            priority: 'low',
            impact: 'Small impact on page load speed',
            effort: 'Low effort - automated conversion available'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Get authenticated audit error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get user's audit history (GET /api/audit without ID)
app.get('/api/audit', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(user => user.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Simulate user's audit history
    const audits = [
      {
        _id: 'audit-1',
        url: 'https://example.com',
        domain: 'example.com',
        status: 'completed',
        overallScore: 92,
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        _id: 'audit-2',
        url: 'https://test.com',
        domain: 'test.com',
        status: 'completed',
        overallScore: 78,
        createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ];

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
