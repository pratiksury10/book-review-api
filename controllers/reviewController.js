const Review = require('../models/Review');

exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const bookId = req.params.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  // Check if user already reviewed this book
  const existingReview = await Review.findOne({ book: bookId, user: req.user._id });
  if (existingReview) {
    return res.status(400).json({ message: 'You have already reviewed this book' });
  }

  const review = new Review({
    book: bookId,
    user: req.user._id,
    rating,
    comment,
  });

  await review.save();
  res.status(201).json(review);
};

exports.updateReview = async (req, res) => {
  const reviewId = req.params.id;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this review' });
  }

  if (rating) {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  await review.save();
  res.json(review);
};

exports.deleteReview = async (req, res) => {
  const reviewId = req.params.id;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this review' });
  }

  await review.deleteOne();
  res.json({ message: 'Review deleted' });
};
