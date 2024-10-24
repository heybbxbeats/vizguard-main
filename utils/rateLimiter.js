const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  enableOfflineQueue: false
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1
});

async function rateLimiterMiddleware(userId) {
  try {
    await rateLimiter.consume(userId);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      msBeforeNext: error.msBeforeNext 
    };
  }
}

module.exports = { rateLimiterMiddleware };