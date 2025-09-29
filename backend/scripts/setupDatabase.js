const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seo-audit-tool');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const setupDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🔧 Setting up database...');
    
    // Create indexes for better performance
    const db = mongoose.connection.db;
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Audits collection indexes
    await db.collection('audits').createIndex({ user: 1, createdAt: -1 });
    await db.collection('audits').createIndex({ url: 1 });
    await db.collection('audits').createIndex({ domain: 1 });
    await db.collection('audits').createIndex({ status: 1 });
    await db.collection('audits').createIndex({ overallScore: -1 });
    await db.collection('audits').createIndex({ isPublic: 1, createdAt: -1 });
    
    console.log('✅ Database indexes created successfully');
    
    // Create sample data (optional)
    const createSampleData = process.argv.includes('--sample');
    if (createSampleData) {
      console.log('📝 Creating sample data...');
      
      const User = require('../src/models/User');
      const Audit = require('../src/models/Audit');
      
      // Create sample user
      const sampleUser = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123',
        isEmailVerified: true,
        subscription: {
          type: 'premium',
          isActive: true
        }
      });
      
      await sampleUser.save();
      console.log('✅ Sample user created');
      
      // Create sample audit
      const sampleAudit = new Audit({
        user: sampleUser._id,
        url: 'https://example.com',
        domain: 'example.com',
        status: 'completed',
        overallScore: 85,
        performance: {
          score: 90,
          firstContentfulPaint: 1200,
          largestContentfulPaint: 2100,
          cumulativeLayoutShift: 0.1,
          timeToInteractive: 3000
        },
        metaTags: {
          title: {
            present: true,
            content: 'Example Website',
            length: 16,
            score: 100
          },
          description: {
            present: true,
            content: 'This is an example website for demonstration purposes.',
            length: 58,
            score: 100
          },
          overallScore: 95
        },
        images: {
          totalImages: 5,
          imagesWithAlt: 4,
          imagesWithoutAlt: 1,
          webpImages: 2,
          optimizedImages: 3,
          largeImages: 1,
          lazyLoadedImages: 2,
          overallScore: 80
        },
        recommendations: [
          {
            category: 'images',
            priority: 'medium',
            title: 'Add Alt Text to Images',
            description: '1 image is missing alt text',
            impact: 'Medium impact on accessibility and SEO',
            effort: 'Low effort - quick win'
          }
        ],
        processingTime: 5000
      });
      
      await sampleAudit.save();
      console.log('✅ Sample audit created');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server: npm run server');
    console.log('2. Start the frontend: npm run client');
    console.log('3. Visit http://localhost:3000 to access the application');
    
    if (createSampleData) {
      console.log('\n🔑 Sample login credentials:');
      console.log('Email: demo@example.com');
      console.log('Password: password123');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run setup
setupDatabase();
