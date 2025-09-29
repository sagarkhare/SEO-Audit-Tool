const User = require('../models/User');
const Audit = require('../models/Audit');
const logger = require('../utils/logger');

// @desc    Get user dashboard data
// @route   GET /api/user/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get recent audits
    const recentAudits = await Audit.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('url domain overallScore status createdAt deviceType');

    // Get audit statistics
    const stats = await Audit.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAudits: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          bestScore: { $max: '$overallScore' },
          worstScore: { $min: '$overallScore' }
        }
      }
    ]);

    // Get monthly audit count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyAudits = await Audit.countDocuments({
      user: user._id,
      createdAt: { $gte: startOfMonth }
    });

    // Get audit trends (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trends = await Audit.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: sevenDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        usage: user.usage,
        isEmailVerified: user.isEmailVerified
      },
      recentAudits,
      statistics: stats[0] || {
        totalAudits: 0,
        avgScore: 0,
        bestScore: 0,
        worstScore: 0
      },
      monthlyAudits,
      trends,
      limits: {
        free: 10,
        basic: 100,
        premium: 500,
        enterprise: -1
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    next(error);
  }
};

// @desc    Update user subscription
// @route   PUT /api/user/subscription
// @access  Private
const updateSubscription = async (req, res, next) => {
  try {
    const { subscriptionType, startDate, endDate } = req.body;

    // Validate subscription type
    const validTypes = ['free', 'basic', 'premium', 'enterprise'];
    if (!validTypes.includes(subscriptionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription type'
      });
    }

    const user = await User.findById(req.user.id);
    
    user.subscription = {
      type: subscriptionType,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true
    };

    await user.save();

    logger.info(`Subscription updated for user ${user.email}: ${subscriptionType}`);

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    logger.error('Update subscription error:', error);
    next(error);
  }
};

// @desc    Get user usage statistics
// @route   GET /api/user/usage
// @access  Private
const getUsageStats = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
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

    const usageStats = await Audit.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalAudits: { $sum: 1 },
          completedAudits: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedAudits: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          avgProcessingTime: { $avg: '$processingTime' },
          avgScore: { $avg: '$overallScore' }
        }
      }
    ]);

    const deviceStats = await Audit.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyStats = await Audit.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: usageStats[0] || {
          totalAudits: 0,
          completedAudits: 0,
          failedAudits: 0,
          avgProcessingTime: 0,
          avgScore: 0
        },
        deviceBreakdown: deviceStats,
        dailyStats,
        currentUsage: req.user.usage,
        limits: {
          free: 10,
          basic: 100,
          premium: 500,
          enterprise: -1
        }
      }
    });
  } catch (error) {
    logger.error('Get usage stats error:', error);
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete all user's audits
    await Audit.deleteMany({ user: req.user.id });

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    logger.info(`Account deleted for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    next(error);
  }
};

// @desc    Export user data
// @route   GET /api/user/export-data
// @access  Private
const exportUserData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const audits = await Audit.find({ user: req.user.id });

    const userData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        preferences: user.preferences,
        usage: user.usage,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      audits: audits.map(audit => ({
        id: audit._id,
        url: audit.url,
        domain: audit.domain,
        overallScore: audit.overallScore,
        status: audit.status,
        deviceType: audit.deviceType,
        createdAt: audit.createdAt,
        processingTime: audit.processingTime,
        performance: audit.performance,
        metaTags: audit.metaTags,
        images: audit.images,
        recommendations: audit.recommendations
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Export user data error:', error);
    next(error);
  }
};

module.exports = {
  getDashboard,
  updateSubscription,
  getUsageStats,
  deleteAccount,
  exportUserData
};
