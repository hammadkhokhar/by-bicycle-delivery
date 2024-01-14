import IORedis from 'ioredis'
import logger from './logger.util';

const redisConfig = {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  maxRetriesPerRequest: null, // required for pub/sub
}

let redisClient: IORedis | any

// Ensure that the client is connected before exporting it
;(async () => {
  try {
    redisClient = new IORedis(redisConfig)
    logger.info('Redis client connected')
  } catch (error) {
    logger.error('Error connecting to Redis:', (error as Error).message)
    process.exit(1)
  }
})()

export default redisClient
