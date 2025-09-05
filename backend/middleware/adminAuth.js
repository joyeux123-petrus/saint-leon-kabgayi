const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization'); // Change to Authorization header
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7, authHeader.length) : authHeader; // Extract token from "Bearer " string

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Not an admin' });
    }

    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = adminAuth;