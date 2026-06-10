// Express server entry point. Stage B: skeleton + GET /users + auth (register/login).
const express = require('express');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json()); // REQUIRED to parse JSON request bodies (req.body)

app.use('/users', require('./routes/users'));
app.use('/todos', require('./routes/todos'));
app.use(require('./routes/auth')); // /register, /login

app.use(notFound);      // 404 for unmatched routes
app.use(errorHandler);  // central error handler (must be last)

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
