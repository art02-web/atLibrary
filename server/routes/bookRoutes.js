const router = require('express').Router();
const ctrl = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');

// Every logged-in user can browse; only admins can change the catalog
router.use(protect);

router.get('/', ctrl.getBooks);
router.get('/categories', ctrl.getCategories);
router.get('/:id', v.idParam(), validate, ctrl.getBook);

router.post('/', authorize('admin'), v.bookRules(), validate, ctrl.createBook);
router.put('/:id', authorize('admin'), v.idParam(), v.bookRules(true), validate, ctrl.updateBook);
router.delete('/:id', authorize('admin'), v.idParam(), validate, ctrl.deleteBook);

module.exports = router;
