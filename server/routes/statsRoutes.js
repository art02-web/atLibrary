const router = require('express').Router();
const ctrl = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), ctrl.adminStats);
router.get('/me', protect, ctrl.userStats);

module.exports = router;
