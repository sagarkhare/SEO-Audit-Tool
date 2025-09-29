const express = require('express');
const {
  getDashboard,
  updateSubscription,
  getUsageStats,
  deleteAccount,
  exportUserData
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// User dashboard and profile routes
router.get('/dashboard', getDashboard);
router.get('/usage', getUsageStats);
router.put('/subscription', updateSubscription);
router.delete('/account', deleteAccount);
router.get('/export-data', exportUserData);

module.exports = router;
