const config = require('./config');

function generateUniqueId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const userRateLimits = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    return false;
  }

  return userLimit.count >= config.rateLimit;
}

function updateRateLimit(userId) {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId) || { count: 0, resetTime: now + config.rateLimitWindow };

  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + config.rateLimitWindow;
  } else {
    userLimit.count++;
  }

  userRateLimits.set(userId, userLimit);
}

module.exports = {
  generateUniqueId,
  isRateLimited,
  updateRateLimit,
};