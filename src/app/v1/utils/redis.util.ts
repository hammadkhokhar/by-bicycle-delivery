import IORedis from 'ioredis'

const redisConfig = {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : undefined,
  maxRetriesPerRequest: null,
}

let redisClient: IORedis | any

  // Ensure that the client is connected before exporting it
;(async () => {
  try {
    redisClient = new IORedis(redisConfig)
    console.log('Redis client connected')
  } catch (error) {
    console.error('Error connecting to Redis:', (error as Error).message)
    process.exit(1)
  }
})()

export default redisClient
