import IORedis, { Redis } from 'ioredis';
import { createRedisConnection } from '../utils/redis.util'; // Adjust the path accordingly
import moment from 'moment';

let redisClient: Redis | undefined;

// Initialize the Redis connection
const initializeRedisConnection = async (): Promise<void> => {
  try {
    const connection = await createRedisConnection();
    redisClient = connection;
    // Event handler for Redis errors.
    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
    });
  } catch (error) {
    console.error('Error initializing Redis connection', error);
    throw error;
  }
};

// Ensure the Redis connection is initialized
initializeRedisConnection();

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
    if (!redisClient) {
      reject(new Error('Redis client not initialized'));
      return;
    }

    // Calculate the TTL until the end of the day
    const ttlInSeconds = calculateTTLUntilEndOfDay();

    // Check if redisClient is still defined after the null check
    if (redisClient) {
      redisClient.setex(routeKey, ttlInSeconds, 'routeExists', (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply || 'OK');
        }
      });
    } else {
      reject(new Error('Redis client not initialized'));
    }
  });
}

/**
 * Checks if a route key exists in Redis.
 * @param {string} routeKey - The key used to identify the route in Redis.
 * @returns {Promise<boolean>} A Promise that resolves to true if the route key exists, or false otherwise.
 */
function checkRouteExistsInRedis(routeKey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!redisClient) {
      reject(new Error('Redis client not initialized'));
      return;
    }

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
