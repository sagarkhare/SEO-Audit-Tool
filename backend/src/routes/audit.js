const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/auditController');
const { protect, checkAuditLimit, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const auditValidation = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('deviceType')
    .optional()
    .isIn(['desktop', 'mobile'])
    .withMessage('Device type must be desktop or mobile'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
];

const batchAuditValidation = [
  body('urls')
    .isArray({ min: 1, max: 10 })
    .withMessage('URLs must be an array with 1-10 items'),
  body('urls.*')
    .isURL()
    .withMessage('Each URL must be valid'),
  body('deviceType')
    .optional()
    .isIn(['desktop', 'mobile'])
    .withMessage('Device type must be desktop or mobile')
];

// Public routes
router.get('/public', getPublicAudits);

// Anonymous audit routes (no authentication required)
router.post('/anonymous', auditValidation, createAnonymousAudit);
router.get('/anonymous/:id', getAnonymousAuditById);

// Protected routes
router.use(protect);

// Single audit routes
router.post('/', auditValidation, checkAuditLimit, createAudit);
router.get('/', getAudits);
router.get('/history', getAuditHistory);
router.get('/:id', getAuditById);
router.delete('/:id', deleteAudit);
router.get('/:id/export', exportAuditReport);

// Batch audit routes (premium feature)
router.post('/batch', batchAuditValidation, checkAuditLimit, createBatchAudit);

module.exports = router;
