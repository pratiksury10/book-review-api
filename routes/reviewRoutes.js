const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

router.post('/books/:id/reviews', protect, addReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
