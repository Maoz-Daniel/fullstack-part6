// Central error handling. Express 5 auto-forwards rejected promises from async route
// handlers here, so handlers can be plain `async` without try/catch wrappers.

// Unmatched route -> 404 JSON.
function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Final error middleware. Uses err.status if a handler set one, else 500.
// eslint-disable-next-line no-unused-vars  (Express needs the 4-arg signature)
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
