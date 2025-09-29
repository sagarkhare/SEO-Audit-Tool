const Audit = require('../models/Audit');
const User = require('../models/User');
const lighthouseService = require('../services/lighthouseService');
const metaTagsService = require('../services/metaTagsService');
const imageAnalysisService = require('../services/imageAnalysisService');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// @desc    Create new audit
// @route   POST /api/audit
// @access  Private
const createAudit = async (req, res, next) => {
  try {
    const { url, deviceType = 'desktop', location = 'us', isPublic = false, tags = [], notes } = req.body;
    
    // Extract domain from URL
    const domain = new URL(url).hostname;
    
    // Create audit record
    const audit = new Audit({
      user: req.user.id,
      url,
      domain,
      deviceType,
      location,
      isPublic,
      tags,
      notes,
      status: 'pending'
    });

    await audit.save();

    // Update user usage
    await req.user.updateUsage();

    // Start audit process asynchronously
    processAudit(audit._id).catch(error => {
      logger.error(`Audit processing failed for ${audit._id}:`, error);
    });

    res.status(201).json({
      success: true,
      message: 'Audit started successfully',
      audit: audit.getSummary()
    });
  } catch (error) {
    logger.error('Create audit error:', error);
    next(error);
  }
};

// @desc    Process audit (async function)
const processAudit = async (auditId) => {
  const startTime = Date.now();
  
  try {
    const audit = await Audit.findById(auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }

    audit.status = 'processing';
    await audit.save();

    logger.info(`Starting audit processing for: ${audit.url}`);

    // Run all analyses in parallel
    const [lighthouseResults, metaTagsResults, imageResults] = await Promise.allSettled([
      lighthouseService.runAudit(audit.url, { deviceType: audit.deviceType }),
      metaTagsService.analyzeMetaTags(audit.url),
      imageAnalysisService.analyzeImages(audit.url)
    ]);

    // Process results
    if (lighthouseResults.status === 'fulfilled') {
      audit.performance = lighthouseResults.value.performance;
      audit.lighthouseReport = lighthouseResults.value.rawReport;
    } else {
      logger.error('Lighthouse analysis failed:', lighthouseResults.reason);
      audit.error = {
        message: 'Lighthouse analysis failed',
        stack: lighthouseResults.reason.message
      };
    }

    if (metaTagsResults.status === 'fulfilled') {
      audit.metaTags = metaTagsResults.value;
    } else {
      logger.error('Meta tags analysis failed:', metaTagsResults.reason);
    }

    if (imageResults.status === 'fulfilled') {
      audit.images = imageResults.value;
    } else {
      logger.error('Image analysis failed:', imageResults.reason);
    }

    // Calculate overall score
    audit.calculateOverallScore();

    // Generate recommendations
    audit.recommendations = generateRecommendations(audit);

    // Update status and processing time
    audit.status = 'completed';
    audit.processingTime = Date.now() - startTime;
    audit.rawData = {
      lighthouse: lighthouseResults.status === 'fulfilled' ? lighthouseResults.value : null,
      metaTags: metaTagsResults.status === 'fulfilled' ? metaTagsResults.value : null,
      images: imageResults.status === 'fulfilled' ? imageResults.value : null
    };

    await audit.save();

    logger.info(`Audit completed for ${audit.url} in ${audit.processingTime}ms`);

  } catch (error) {
    logger.error(`Audit processing error for ${auditId}:`, error);
    
    try {
      const audit = await Audit.findById(auditId);
      if (audit) {
        audit.status = 'failed';
        audit.error = {
          message: error.message,
          stack: error.stack
        };
        audit.processingTime = Date.now() - startTime;
        await audit.save();
      }
    } catch (saveError) {
      logger.error('Failed to save audit error:', saveError);
    }
  }
};

// @desc    Get user's audits
// @route   GET /api/audit
// @access  Private
const getAudits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const status = req.query.status;
    const deviceType = req.query.deviceType;

    let query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (deviceType) {
      query.deviceType = deviceType;
    }

    const audits = await Audit.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('url domain overallScore status createdAt deviceType processingTime')
      .exec();

    const total = await Audit.countDocuments(query);

    res.status(200).json({
      success: true,
      count: audits.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      audits
    });
  } catch (error) {
    logger.error('Get audits error:', error);
    next(error);
  }
};

// @desc    Get single audit
// @route   GET /api/audit/:id
// @access  Private
const getAuditById = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Check if user owns the audit or if it's public
    if (audit.user.toString() !== req.user.id && !audit.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this audit'
      });
    }

    res.status(200).json({
      success: true,
      audit
    });
  } catch (error) {
    logger.error('Get audit by ID error:', error);
    next(error);
  }
};

// @desc    Delete audit
// @route   DELETE /api/audit/:id
// @access  Private
const deleteAudit = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Check if user owns the audit
    if (audit.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this audit'
      });
    }

    await audit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Audit deleted successfully'
    });
  } catch (error) {
    logger.error('Delete audit error:', error);
    next(error);
  }
};

// @desc    Get public audits
// @route   GET /api/audit/public
// @access  Public
const getPublicAudits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const audits = await Audit.getPublicAudits(page, limit);

    res.status(200).json({
      success: true,
      count: audits.length,
      audits
    });
  } catch (error) {
    logger.error('Get public audits error:', error);
    next(error);
  }
};

// @desc    Create batch audit
// @route   POST /api/audit/batch
// @access  Private
const createBatchAudit = async (req, res, next) => {
  try {
    const { urls, deviceType = 'desktop', location = 'us' } = req.body;
    
    // Check if user has premium subscription for batch audits
    if (req.user.subscription.type === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Batch audits require premium subscription'
      });
    }

    const audits = [];
    
    for (const url of urls) {
      const domain = new URL(url).hostname;
      
      const audit = new Audit({
        user: req.user.id,
        url,
        domain,
        deviceType,
        location,
        status: 'pending'
      });

      await audit.save();
      audits.push(audit.getSummary());

      // Start audit process asynchronously
      processAudit(audit._id).catch(error => {
        logger.error(`Batch audit processing failed for ${audit._id}:`, error);
      });
    }

    // Update user usage
    await req.user.updateUsage();

    res.status(201).json({
      success: true,
      message: `Batch audit started for ${urls.length} URLs`,
      audits
    });
  } catch (error) {
    logger.error('Create batch audit error:', error);
    next(error);
  }
};

// @desc    Get audit history
// @route   GET /api/audit/history
// @access  Private
const getAuditHistory = async (req, res, next) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const history = await Audit.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: dateFilter,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupBy === 'day' 
            ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            : groupBy === 'week'
            ? { $dateToString: { format: '%Y-%U', date: '$createdAt' } }
            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Get audit history error:', error);
    next(error);
  }
};

// @desc    Export audit report
// @route   GET /api/audit/:id/export
// @access  Private
const exportAuditReport = async (req, res, next) => {
  try {
    const { format = 'pdf' } = req.query;
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Check if user owns the audit
    if (audit.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export this audit'
      });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="audit-${audit._id}.pdf"`);
      doc.pipe(res);

      // Add content to PDF
      doc.fontSize(20).text('SEO Audit Report', 50, 50);
      doc.fontSize(12).text(`URL: ${audit.url}`, 50, 100);
      doc.text(`Overall Score: ${audit.overallScore}/100`, 50, 120);
      doc.text(`Date: ${audit.createdAt.toLocaleDateString()}`, 50, 140);
      
      // Add performance metrics
      if (audit.performance) {
        doc.text('Performance Metrics:', 50, 180);
        doc.text(`Score: ${audit.performance.score}/100`, 70, 200);
        doc.text(`First Contentful Paint: ${audit.performance.firstContentfulPaint}ms`, 70, 220);
        doc.text(`Largest Contentful Paint: ${audit.performance.largestContentfulPaint}ms`, 70, 240);
      }

      doc.end();
    } else if (format === 'csv') {
      const csvData = [
        {
          url: audit.url,
          overallScore: audit.overallScore,
          performanceScore: audit.performance?.score || 0,
          metaTagsScore: audit.metaTags?.overallScore || 0,
          imagesScore: audit.images?.overallScore || 0,
          createdAt: audit.createdAt.toISOString()
        }
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-${audit._id}.csv"`);
      
      const csvWriter = createCsvWriter({
        path: 'temp.csv',
        header: [
          { id: 'url', title: 'URL' },
          { id: 'overallScore', title: 'Overall Score' },
          { id: 'performanceScore', title: 'Performance Score' },
          { id: 'metaTagsScore', title: 'Meta Tags Score' },
          { id: 'imagesScore', title: 'Images Score' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });

      await csvWriter.writeRecords(csvData);
      res.sendFile('temp.csv', { root: '.' });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format. Supported formats: pdf, csv'
      });
    }
  } catch (error) {
    logger.error('Export audit report error:', error);
    next(error);
  }
};

// Helper function to generate recommendations
const generateRecommendations = (audit) => {
  const recommendations = [];

  // Performance recommendations
  if (audit.performance && audit.performance.score < 80) {
    recommendations.push({
      category: 'performance',
      priority: 'high',
      title: 'Improve Page Performance',
      description: 'Your page performance score is below 80. Consider optimizing images, reducing JavaScript, and improving server response times.',
      impact: 'High impact on user experience and SEO rankings',
      effort: 'Medium effort - requires development work',
      resources: [
        'https://web.dev/fast/',
        'https://developers.google.com/speed/pagespeed/insights/'
      ]
    });
  }

  // Meta tags recommendations
  if (audit.metaTags && audit.metaTags.overallScore < 80) {
    recommendations.push({
      category: 'meta-tags',
      priority: 'medium',
      title: 'Optimize Meta Tags',
      description: 'Improve your meta tags for better SEO and social media sharing.',
      impact: 'Medium impact on search rankings and click-through rates',
      effort: 'Low effort - quick win',
      resources: [
        'https://developers.google.com/search/docs/beginner/seo-starter-guide',
        'https://moz.com/learn/seo/title-tag'
      ]
    });
  }

  // Image recommendations
  if (audit.images && audit.images.overallScore < 80) {
    recommendations.push({
      category: 'images',
      priority: 'medium',
      title: 'Optimize Images',
      description: 'Improve your image optimization for better page load speeds.',
      impact: 'Medium impact on page load speed',
      effort: 'Medium effort - requires image optimization',
      resources: [
        'https://web.dev/fast/#optimize-your-images',
        'https://developers.google.com/speed/docs/insights/OptimizeImages'
      ]
    });
  }

  return recommendations;
};

// @desc    Create anonymous audit (no authentication required)
// @route   POST /api/audit/anonymous
// @access  Public
const createAnonymousAudit = async (req, res, next) => {
  try {
    const { url, deviceType = 'desktop', location = 'us' } = req.body;
    
    // Extract domain from URL
    const domain = new URL(url).hostname;
    
    // Create audit record without user (anonymous)
    const audit = new Audit({
      url,
      domain,
      deviceType,
      location,
      isPublic: true, // Anonymous audits are public by default
      status: 'pending'
    });

    await audit.save();

    // Start audit process asynchronously
    processAudit(audit._id).catch(error => {
      logger.error(`Anonymous audit processing failed for ${audit._id}:`, error);
    });

    res.status(201).json({
      success: true,
      message: 'Anonymous audit started successfully',
      audit: audit.getSummary()
    });
  } catch (error) {
    logger.error('Create anonymous audit error:', error);
    next(error);
  }
};

// @desc    Get anonymous audit by ID (no authentication required)
// @route   GET /api/audit/anonymous/:id
// @access  Public
const getAnonymousAuditById = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Only allow access to anonymous/public audits
    if (!audit.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This audit requires authentication'
      });
    }

    res.status(200).json({
      success: true,
      audit
    });
  } catch (error) {
    logger.error('Get anonymous audit by ID error:', error);
    next(error);
  }
};

module.exports = {
  createAudit,
  getAudits,
  getAuditById,
  deleteAudit,
  getPublicAudits,
  createBatchAudit,
  getAuditHistory,
  exportAuditReport,
  createAnonymousAudit,
  getAnonymousAuditById
};
