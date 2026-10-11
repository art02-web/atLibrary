const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

// Whole router is admin-only
router.use(protect, authorize('admin'));

router.get('/', ctrl.getUsers);
router.post('/', v.adminUserRules(), validate, ctrl.createUser);
router.get('/:id', v.idParam(), validate, ctrl.getUser);
router.put('/:id', v.idParam(), v.adminUserRules(true), validate, ctrl.updateUser);
router.delete('/:id', v.idParam(), validate, ctrl.deleteUser);

module.exports = router;
