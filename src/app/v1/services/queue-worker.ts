import IORedis from 'ioredis'
import { Worker, WorkerOptions, Job } from 'bullmq'
import { processQuotation } from '../helper/orders.helper'
import logger from '../utils/logger.util'

enum QuoteStatus {
  Quoted = 'QUOTED'
}

const queueWorker = (connection: IORedis): Worker => {
  // Create a new worker options object
  const workerOptions: WorkerOptions = {
    connection,
  }

  // Create a new worker to process jobs from the quote-queue
  return new Worker(
    'quote-queue',
    async (job: Job) => {
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
      try {
        logger.info('Worker received job', job.name, job.id)
        await delay(12000) // delay for 12 seconds to avoid rate limiting with distance API
        logger.info('Worker processing job', job.name, job.id)
        const result = await processQuotation(job.data, job.id as string)

        // check if error
        if (result.error) {
          // update order with error
          await job.updateData({
            note: result.error.message,
            quoteId: result.quoteId,
            distance: result.error.distance,
            code: result.error.code,
            status: 'Contact us for more information',
          })
          return
        }
        await job.updateData({
          quoteId: result.quoteId,
          status: QuoteStatus.Quoted
        })
      } catch (error) {
        // Log and handle errors within the worker
        logger.error('Error processing job', job.name, job.id, error)
      }
    },
    workerOptions,
  )
}

export default queueWorker
