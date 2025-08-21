// Simple rate limiter middleware for Express
const rateLimit = {};
const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10; // max 10 requests per window

module.exports = function (req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimit[ip]) {
    rateLimit[ip] = [];
  }
  // Remove old timestamps
  rateLimit[ip] = rateLimit[ip].filter(ts => now - ts < WINDOW_SIZE);
  if (rateLimit[ip].length >= MAX_ATTEMPTS) {
    return res.status(429).send('Too many login attempts. Please try again later.');
  }
  rateLimit[ip].push(now);
  next();
};
