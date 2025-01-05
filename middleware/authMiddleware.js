const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET;

const JWT_SECRET = 'your_secret_key';

const verifyRole = (requiredRole) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== requiredRole) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyRole };
