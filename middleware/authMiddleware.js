const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Pridanie dekódovaného tokenu do requestu
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// 🟢 Exportuj funkcie správne ako objekt
module.exports = {
  authenticateToken,
  authorizeRole,
};
