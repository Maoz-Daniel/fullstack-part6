// Shared pagination helper (Stage F). The DB layer fetches `limit + 1` rows; we use the
// extra row to know whether a next page exists, WITHOUT a COUNT(*) query. The response
// body stays a bare array (same shape as /posts, /comments); "is there a next page" is
// signalled by an RFC-5988 Link header with rel="next", present only when applicable.
// (No X-Total-Count — deliberately avoided.)

// Build `<url>; rel="next"`, carrying the current query params forward but bumping page.
function buildNextLink(req, query, nextPage) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(query)) {
    if (key === 'page' || val === undefined || val === null || val === '') continue;
    params.set(key, String(val));
  }
  params.set('page', String(nextPage));
  const base = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
  return `<${base}?${params.toString()}>; rel="next"`;
}

// Slice off the probe row and emit the array (+ Link header when there's a next page).
function sendPaginated(req, res, rows, { page, limit, query }) {
  const hasNext = rows.length > limit;
  const data = hasNext ? rows.slice(0, limit) : rows;
  if (hasNext) {
    res.set('Link', buildNextLink(req, query, page + 1));
  }
  res.json(data);
}

module.exports = { sendPaginated };
