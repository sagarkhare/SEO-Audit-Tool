# SEO Audit Tool - Complete Full-Stack Application

A comprehensive SEO audit tool built with React frontend, Node.js backend, and MongoDB database. This tool analyzes website performance, meta tags, and images to provide detailed SEO insights and recommendations.

## 🚀 Features

### MUST HAVE (Core Features)
- ✅ URL input and validation
- ✅ Performance analysis using Google Lighthouse
- ✅ Meta tags analysis (title, description, Open Graph, Twitter Cards)
- ✅ Image optimization analysis
- ✅ Results display with scoring system
- ✅ User authentication and authorization
- ✅ MongoDB database integration

### SHOULD HAVE (Enhanced UX)
- ✅ Advanced performance metrics
- ✅ Comprehensive meta tags analysis
- ✅ Detailed image analysis with format optimization
- ✅ Enhanced UI/UX with loading states
- ✅ Rate limiting and input validation
- ✅ Results history and dashboard

### COULD HAVE (Nice-to-Have)
- ✅ Batch analysis for multiple URLs
- ✅ Export features (PDF, CSV)
- ✅ Advanced analytics and trends
- ✅ Dark mode theme support
- ✅ Real-time notifications
- ✅ API integration with external services

### WON'T HAVE (Future Considerations)
- ✅ User authentication with JWT
- ✅ Database storage with MongoDB
- ✅ Premium subscription tiers
- ✅ Real-time monitoring capabilities
- ✅ Advanced reporting features

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Google Lighthouse** for performance analysis
- **Puppeteer** for web scraping
- **Cheerio** for HTML parsing
- **Sharp** for image analysis
- **Nodemailer** for email notifications
- **Redis** for caching and rate limiting

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **React Query** for data fetching
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Framer Motion** for animations
- **React Icons** for iconography
- **Custom CSS** with dark mode support

### Database
- **MongoDB** for primary data storage
- **Redis** for caching and session management

## 📁 Project Structure

```
seo-audit-tool/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── logs/              # Application logs
│   ├── uploads/           # File uploads
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS styles
│   │   └── utils/         # Utility functions
│   └── package.json
├── docs/                  # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seo-audit-tool
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Copy backend environment file
   cp backend/env.example backend/.env
   
   # Copy frontend environment file
   cp frontend/.env.example frontend/.env
   ```

4. **Configure environment variables**
   
   Edit `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/seo-audit-tool
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   REDIS_URL=redis://localhost:6379
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:3000
   ```

   Edit `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Set up MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   
   # Or if using MongoDB Compass, make sure it's connected to localhost:27017
   ```

6. **Set up Redis**
   ```bash
   # Start Redis service
   sudo systemctl start redis
   
   # Or if using Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

7. **Run the application**
   ```bash
   # Start both frontend and backend in development mode
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/health

## 📊 Database Setup with MongoDB Compass

### Using MongoDB Compass

1. **Install MongoDB Compass**
   - Download from: https://www.mongodb.com/products/compass
   - Install and launch the application

2. **Connect to MongoDB**
   - Open MongoDB Compass
   - Connection string: `mongodb://localhost:27017`
   - Click "Connect"

3. **Create Database**
   - Click "Create Database"
   - Database name: `seo-audit-tool`
   - Collection name: `users` (will be created automatically)

4. **Verify Collections**
   The application will automatically create these collections:
   - `users` - User accounts and profiles
   - `audits` - SEO audit results and history
   - `sessions` - User sessions (if using session storage)

### Manual Database Setup

If you prefer to set up the database manually:

```bash
# Connect to MongoDB shell
mongosh

# Create database
use seo-audit-tool

# Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password"],
      properties: {
        name: { bsonType: "string", minLength: 2, maxLength: 50 },
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
        password: { bsonType: "string", minLength: 6 }
      }
    }
  }
})

db.createCollection("audits", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user", "url", "domain"],
      properties: {
        url: { bsonType: "string", pattern: "^https?://" },
        domain: { bsonType: "string" },
        overallScore: { bsonType: "int", minimum: 0, maximum: 100 }
      }
    }
  }
})
```

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Setup database
npm run setup-db
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Audits
- `POST /api/audit` - Create new audit
- `GET /api/audit` - Get user's audits
- `GET /api/audit/:id` - Get specific audit
- `DELETE /api/audit/:id` - Delete audit
- `POST /api/audit/batch` - Create batch audit
- `GET /api/audit/history` - Get audit history
- `GET /api/audit/:id/export` - Export audit report

### User Management
- `GET /api/user/dashboard` - Get dashboard data
- `GET /api/user/usage` - Get usage statistics
- `PUT /api/user/subscription` - Update subscription
- `DELETE /api/user/account` - Delete account

## 🎨 Features Overview

### Performance Analysis
- Core Web Vitals (FCP, LCP, CLS, TTI)
- Speed Index and First Input Delay
- Performance score calculation
- Detailed recommendations

### Meta Tags Analysis
- Title tag optimization
- Meta description analysis
- Open Graph tags validation
- Twitter Card tags check
- Canonical URL verification
- Structured data detection

### Image Analysis
- Alt text presence check
- Image format optimization
- Compression analysis
- Lazy loading detection
- Image dimensions validation

### User Features
- User registration and authentication
- Dashboard with audit history
- Usage statistics and limits
- Export reports (PDF, CSV)
- Dark mode support
- Responsive design

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Environment variable protection

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🌙 Dark Mode

The application includes a complete dark mode implementation:
- Toggle between light and dark themes
- Persistent theme preference
- Smooth transitions
- Consistent design across all components

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
REDIS_URL=redis://your-production-redis
FRONTEND_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the logs in `backend/logs/`
2. Verify your environment variables
3. Ensure MongoDB and Redis are running
4. Check the API health endpoint: `GET /api/health`

## 🔄 Updates and Maintenance

The application includes:
- Automatic error logging
- Health check endpoints
- Database connection monitoring
- Performance metrics tracking
- User activity logging

---

**Built with ❤️ using React, Node.js, and MongoDB**
