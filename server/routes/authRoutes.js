const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');
const { avatarUpload } = require('../middleware/avatarUpload');

// Slow down brute-force login / sign-up attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', authLimiter, v.registerRules, validate, ctrl.register);
router.post('/login', authLimiter, v.loginRules, validate, ctrl.login);
router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, v.updateProfileRules, validate, ctrl.updateMe);
router.put('/me/avatar', protect, avatarUpload, ctrl.uploadAvatar);
router.delete('/me/avatar', protect, ctrl.removeAvatar);
router.put('/change-password', protect, v.changePasswordRules, validate, ctrl.changePassword);

module.exports = router;
