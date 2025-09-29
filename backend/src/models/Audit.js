const mongoose = require('mongoose');

const performanceMetricsSchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  firstContentfulPaint: Number,
  largestContentfulPaint: Number,
  cumulativeLayoutShift: Number,
  timeToInteractive: Number,
  speedIndex: Number,
  firstInputDelay: Number,
  totalBlockingTime: Number
});

const metaTagsSchema = new mongoose.Schema({
  title: {
    present: Boolean,
    content: String,
    length: Number,
    score: Number
  },
  description: {
    present: Boolean,
    content: String,
    length: Number,
    score: Number
  },
  openGraph: {
    title: String,
    description: String,
    image: String,
    url: String,
    type: String,
    score: Number
  },
  twitterCard: {
    card: String,
    title: String,
    description: String,
    image: String,
    score: Number
  },
  canonical: {
    present: Boolean,
    url: String,
    score: Number
  },
  robots: {
    present: Boolean,
    content: String,
    score: Number
  },
  structuredData: {
    present: Boolean,
    types: [String],
    score: Number
  },
  overallScore: Number
});

const imageAnalysisSchema = new mongoose.Schema({
  totalImages: Number,
  imagesWithAlt: Number,
  imagesWithoutAlt: Number,
  webpImages: Number,
  optimizedImages: Number,
  largeImages: Number,
  lazyLoadedImages: Number,
  issues: [{
    type: String,
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  overallScore: Number
});

const auditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  domain: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  performance: performanceMetricsSchema,
  metaTags: metaTagsSchema,
  images: imageAnalysisSchema,
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  recommendations: [{
    category: {
      type: String,
      enum: ['performance', 'meta-tags', 'images', 'general']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    title: String,
    description: String,
    impact: String,
    effort: String,
    resources: [String]
  }],
  lighthouseReport: {
    type: mongoose.Schema.Types.Mixed
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed
  },
  processingTime: Number, // in milliseconds
  error: {
    message: String,
    stack: String
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
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for better performance
auditSchema.index({ user: 1, createdAt: -1 });
auditSchema.index({ url: 1 });
auditSchema.index({ domain: 1 });
auditSchema.index({ status: 1 });
auditSchema.index({ overallScore: -1 });
auditSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for audit age
auditSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to calculate overall score
auditSchema.methods.calculateOverallScore = function() {
  const weights = {
    performance: 0.4,
    metaTags: 0.3,
    images: 0.3
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  if (this.performance && this.performance.score !== undefined) {
    totalScore += this.performance.score * weights.performance;
    totalWeight += weights.performance;
  }
  
  if (this.metaTags && this.metaTags.overallScore !== undefined) {
    totalScore += this.metaTags.overallScore * weights.metaTags;
    totalWeight += weights.metaTags;
  }
  
  if (this.images && this.images.overallScore !== undefined) {
    totalScore += this.images.overallScore * weights.images;
    totalWeight += weights.images;
  }
  
  this.overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  return this.overallScore;
};

// Method to get audit summary
auditSchema.methods.getSummary = function() {
  return {
    id: this._id,
    url: this.url,
    domain: this.domain,
    overallScore: this.overallScore,
    status: this.status,
    createdAt: this.createdAt,
    processingTime: this.processingTime,
    deviceType: this.deviceType
  };
};

// Static method to get user's audit history
auditSchema.statics.getUserAudits = function(userId, page = 1, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('url domain overallScore status createdAt deviceType')
    .exec();
};

// Static method to get public audits
auditSchema.statics.getPublicAudits = function(page = 1, limit = 10) {
  return this.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('url domain overallScore createdAt deviceType')
    .exec();
};

module.exports = mongoose.model('Audit', auditSchema);
