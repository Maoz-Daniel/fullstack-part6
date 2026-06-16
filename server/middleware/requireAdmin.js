function requireAdmin(req, res, next) {
  if (!req.activeUser || req.activeUser.is_admin !== 1) {
    return res.status(403).json({ error: 'Admin access is required' });
  }

  next();
}

module.exports = { requireAdmin };
