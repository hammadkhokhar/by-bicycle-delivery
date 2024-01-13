import { Queue } from 'bullmq'
import redisClient from '../utils/redis.util'

export const quoteQueue = new Queue('quote-queue', { connection: redisClient })
