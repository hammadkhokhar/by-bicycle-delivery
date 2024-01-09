import 'dotenv/config'
import { createClient } from 'redis'

/**
 * Redis client instance.
 */
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT as unknown as number,
  },
})

redisClient.on('error', (error) => console.error(`Error: ${error}`))

// Connect asynchronously
async function connectRedisClient() {
  return new Promise<void>((resolve, reject) => {
    redisClient.on('connect', () => {
      console.log('Connected to Redis')
      resolve()
    })

    redisClient.on('error', (error) => {
      console.error(`Failed to connect to Redis: ${error}`)
      reject(error)
    })
  })
}

// Connect to Redis immediately upon importing the module
;(async () => {
  try {
    await connectRedisClient()
  } catch (error) {
    console.error('Error establishing connection to Redis', error)
  }
})()

export { redisClient }
