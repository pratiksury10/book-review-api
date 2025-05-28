const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Review = require('../models/Review');
const {protect} = require('../middlewares/authMiddleware');

// POST /add-book
router.post('/add-book', protect, async (req, res) => {
  try {
    const { title, author, genre } = req.body;
    const book = new Book({
      title,
      author,
      genre,
      createdBy: req.user.id
    });
    await book.save();
    res.status(201).json({ message: 'Book created', book });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// GET /books - list all books with pagination & optional filters (author, genre)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const author = req.query.author || '';
    const genre = req.query.genre || '';

    // Build filter object
    let filter = {};
    if (author) filter.author = new RegExp(author, 'i'); // case-insensitive regex
    if (genre) filter.genre = new RegExp(genre, 'i');

    const skip = (page - 1) * limit;

    const total = await Book.countDocuments(filter);

    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalBooks: total,
      books,
    });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter q is required' });
    }

    const regex = new RegExp(q, 'i'); // 'i' for case-insensitive

    const filter = {
      $or: [
        { title: { $regex: regex } },
        { author: { $regex: regex } }
      ]
    };

    const totalBooks = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalBooks / limit);
    const books = await Book.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalBooks,
      books
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// GET /books/:id
router.get('/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Find book by ID
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Aggregate average rating
    const ratingAggregation = await Review.aggregate([
      { $match: { book: book._id } },
      {
        $group: {
          _id: '$book',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const avgRating = ratingAggregation.length ? ratingAggregation[0].avgRating : null;
    const totalReviews = ratingAggregation.length ? ratingAggregation[0].count : 0;

    // Get paginated reviews, populate user details
    const reviews = await Review.find({ book: book._id })
      .populate('user', 'name email') // adjust fields you want to expose
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      book,
      avgRating: avgRating ? avgRating.toFixed(2) : null,
      totalReviews,
      page,
      totalPages,
      reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /books/:id/reviews — Add a review for a specific book (authenticated)
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({ book: bookId, user: userId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    // Create review
    const review = new Review({
      book: bookId,
      user: userId,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({ message: 'Review added', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.get('/search', async (req, res) => {
//   try {
//     const { q, page = 1, limit = 10 } = req.query;
//     if (!q) {
//       return res.status(400).json({ message: 'Query parameter q is required' });
//     }

//     const regex = new RegExp(q, 'i'); // 'i' for case-insensitive

//     const filter = {
//       $or: [
//         { title: { $regex: regex } },
//         { author: { $regex: regex } }
//       ]
//     };

//     const totalBooks = await Book.countDocuments(filter);
//     const totalPages = Math.ceil(totalBooks / limit);
//     const books = await Book.find(filter)
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .sort({ createdAt: -1 });

//     res.json({
//       page: parseInt(page),
//       limit: parseInt(limit),
//       totalPages,
//       totalBooks,
//       books
//     });
//   } catch (err) {
//     console.error('Search error:', err);
//     res.status(500).json({ message: 'Server error during search' });
//   }
// });


module.exports = router;







// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middlewares/authMiddleware');
// const {
//   createBook,
//   getBooks,
//   getBookById,
// } = require('../controllers/bookController');

// router.post('/', protect, createBook);
// router.get('/', getBooks);
// router.get('/:id', getBookById);

// module.exports = router;
