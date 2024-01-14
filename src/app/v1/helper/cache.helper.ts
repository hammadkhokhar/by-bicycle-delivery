import redisClient from '../utils/redis.util'
import moment from 'moment'

/**
 * Calculates the time-to-live (TTL) until the end of the given day
 * @returns {number} The TTL in seconds.
 */
function calculateTTLUntilEndOfDay(date:Date): number {
  const now = moment()
  const endOfDay = moment(date).endOf('day')
  return endOfDay.diff(now, 'seconds')
}

/**
 * Sets a value in Redis for the given route key with a cache expiry until the end of given day.
 * @param {string} routeKey - The key used to identify the route in Redis.
 * @returns {Promise<string>} A Promise that resolves to the reply from Redis or rejects with an error.
 */
function setRouteInRedis(routeKey: string, pickupDate: Date): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!redisClient) {
      reject(new Error('Redis client not initialized'))
      return
    }

    // Calculate the TTL until the end of the day
    const ttlInSeconds = calculateTTLUntilEndOfDay(pickupDate)

    // Check if redisClient is still defined after the null check
    if (redisClient) {
      redisClient.setex(routeKey, ttlInSeconds, 'routeExists', (err: any, reply: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(reply || 'OK')
        }
      })
    } else {
      reject(new Error('Redis client not initialized'))
    }
  })
}

/**
 * Checks if a route key exists in Redis.
 * @param {string} routeKey - The key used to identify the route in Redis.
 * @returns {Promise<boolean>} A Promise that resolves to true if the route key exists, or false otherwise.
 */
function checkRouteExistsInRedis(routeKey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!redisClient) {
      reject(new Error('Redis client not initialized'))
      return
    }

    redisClient
      .exists(routeKey)
      .then((reply: number) => {
        resolve(reply === 1)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

export { setRouteInRedis, checkRouteExistsInRedis }
