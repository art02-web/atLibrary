const router = require('express').Router();
const ctrl = require('../controllers/borrowController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

router.use(protect);

// User actions
router.post('/', authorize('user'), v.borrowRequestRules, validate, ctrl.requestBorrow);
router.get('/my', ctrl.getMyBorrows);
router.put('/:id/cancel', v.idParam(), validate, ctrl.cancelRequest);

// Admin (librarian) actions
router.get('/', authorize('admin'), ctrl.getAllBorrows);
router.put('/:id/approve', authorize('admin'), v.idParam(), validate, ctrl.approveBorrow);
router.put('/:id/reject', authorize('admin'), v.idParam(), validate, ctrl.rejectBorrow);
router.put('/:id/return', authorize('admin'), v.idParam(), validate, ctrl.returnBorrow);
router.delete('/:id', authorize('admin'), v.idParam(), validate, ctrl.deleteBorrow);

module.exports = router;
