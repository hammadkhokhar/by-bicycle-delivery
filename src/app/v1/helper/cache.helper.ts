import IORedis, { Redis } from 'ioredis';
import moment from 'moment';

/**
 * Redis client instance for interacting with a Redis server.
 * @type {Redis}
 */
const redisClient: Redis = new IORedis();

/**
 * Event handler for Redis errors.
 * @param {Error} err - The Redis error.
 */
redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

/**
 * Calculates the time-to-live (TTL) until the end of the day in seconds.
 * @returns {number} The TTL in seconds.
 */
function calculateTTLUntilEndOfDay(): number {
  const now = moment();
  const endOfDay = moment().endOf('day');
  return endOfDay.diff(now, 'seconds');
}

/**
 * Sets a value in Redis for the given route key with a cache expiry until the end of the day.
 * @param {string} routeKey - The key used to identify the route in Redis.
 * @returns {Promise<string>} A Promise that resolves to the reply from Redis or rejects with an error.
 */
function setRouteInRedis(routeKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Calculate the TTL until the end of the day
    const ttlInSeconds = calculateTTLUntilEndOfDay();

    redisClient.setex(routeKey, ttlInSeconds, 'routeExists', (err, reply) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply || 'OK');
      }
    });
  });
}

/**
 * Checks if a route key exists in Redis.
 * @param {string} routeKey - The key used to identify the route in Redis.
 * @returns {Promise<boolean>} A Promise that resolves to true if the route key exists, or false otherwise.
 */
function checkRouteExistsInRedis(routeKey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    redisClient
      .exists(routeKey)
      .then((reply) => {
        resolve(reply === 1);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export { setRouteInRedis, checkRouteExistsInRedis };