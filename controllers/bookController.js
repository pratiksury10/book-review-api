const Book = require('../models/Book');
const Review = require('../models/Review');

exports.createBook = async (req, res) => {
  const { title, author, genre } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: 'Title and author are required' });
  }

  const book = new Book({
    title,
    author,
    genre,
    createdBy: req.user._id,
  });

  await book.save();
  res.status(201).json(book);
};

exports.getBooks = async (req, res) => {
  const { page = 1, limit = 10, author, genre } = req.query;

  const filter = {};
  if (author) filter.author = new RegExp(author, 'i');
  if (genre) filter.genre = new RegExp(genre, 'i');

  const books = await Book.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Book.countDocuments(filter);

  res.json({
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    books,
  });
};

exports.getBookById = async (req, res) => {
  const bookId = req.params.id;

  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  // Calculate average rating
  const agg = await Review.aggregate([
    { $match: { book: book._id } },
    {
      $group: {
        _id: '$book',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = agg.length > 0 ? agg[0].avgRating : null;

  // Reviews pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const reviews = await Review.find({ book: book._id })
    .populate('user', 'username')
    .skip((page - 1) * limit)
    .limit(limit);

  const totalReviews = await Review.countDocuments({ book: book._id });

  res.json({
    book,
    avgRating,
    reviews,
    reviewPagination: {
      total: totalReviews,
      page,
      pages: Math.ceil(totalReviews / limit),
    },
  });
};
