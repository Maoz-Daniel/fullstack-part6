// Express server entry point. Stage B: skeleton + GET /users + auth (register/login).
const cors = require('cors');
const express = require('express');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json()); // REQUIRED to parse JSON request bodies (req.body)
app.use(
  cors({
    origin: 'http://localhost:5173',
    // Expose the Link header so the browser's fetch can read pagination info cross-origin
    // (Stage F: albums/photos signal the next page via Link: rel="next").
    exposedHeaders: ['Link'],
  })
);

app.use('/users', require('./routes/users'));
app.use('/todos', require('./routes/todos'));
app.use('/posts', require('./routes/posts'));
app.use('/comments', require('./routes/comments'));
app.use('/albums', require('./routes/albums'));
app.use('/photos', require('./routes/photos'));
app.use(require('./routes/auth')); // /register, /login

app.use(notFound);      // 404 for unmatched routes
app.use(errorHandler);  // central error handler (must be last)

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
