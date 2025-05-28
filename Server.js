require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const Book = require('./models/Book');
const { protect } = require('./middlewares/authMiddleware');
const authRoutes = require('./routes/authRoutes');
// const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/reviews', reviewRoutes);

const PORT = process.env.PORT || 5010;

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});


app.post('/add-book', protect , async (req, res) => {
  try {
    const { title, author } = req.body;
    console.log('Received data:', req.body); // ✅ Log the data

    const book = new Book({ title, author });
    await book.save();
    res.status(201).json({ message: 'Book created', book });
  } catch (err) {
    console.error('Error:', err); // ✅ Log the actual error
    res.status(500).json({ error: 'Failed to create book' });
  }
});


app.post('/books', protect , async (req, res) => {
  try {
    const { title, author, genre } = req.body;
    const book = new Book({ title, author, genre, createdBy: req.user.id });
    await book.save();
    res.status(201).json({ message: 'Book created', book });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

app.post('/api/users/signup', (req, res) => {
  res.json({ message: 'Register route is working' });
});


// app.post('/add-book', async (req, res) => {
//   try {
//     const { title, author } = req.body;
//     const book = new Book({ title, author });
//     await book.save();
//     res.status(201).json({ message: 'Book created', book });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to create book' });
//   }
// });


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
