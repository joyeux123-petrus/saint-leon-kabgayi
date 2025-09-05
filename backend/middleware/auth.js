const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  // Extract token from "Bearer " string if present
  const actualToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  jwt.verify(actualToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token.' });
    }
    req.user = decoded;
    console.log('Decoded token payload (req.user):', req.user);
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    next();
  };
};

const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireRoles
};
