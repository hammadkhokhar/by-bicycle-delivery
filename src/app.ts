import 'dotenv/config'
import express from 'express'
import * as http from 'http'
import cors from 'cors'
import { Worker } from 'bullmq'
import { processQuotation } from './app/v1/helper/orders.helper'
import cluster from 'cluster'
import { setupSwagger } from './app/v1/helper/swagger.helper'
import debug from 'debug'
import swaggerUi from 'swagger-ui-express'
import IORedis from 'ioredis'
import errorHandler from './app/v1/utils/error.util'
import { CommonRoutesConfig } from './common/common.routes.config'
import { OrdersRoutes } from './app/v1/routes/orders.routes.config'
import logger from './app/v1/utils/logger.util'

// Create a new express application instance
const app: express.Application = express()

// Create an HTTP server using the Express application
const server: http.Server = http.createServer(app)

// Set the port to use, defaulting to 80 or using the value from the environment
const port = process.env.PORT || 80

// Debug logger for application-wide debugging
const debugLog: debug.IDebugger = debug('app')

// Middleware setup
app.use(express.json()) // Parse incoming JSON requests
app.use(express.urlencoded({ extended: false })) // Parse URL-encoded requests
app.use(cors()) // Enable Cross-Origin Resource Sharing (CORS)
app.disable('x-powered-by') // Disable x-powered-by header

// Set up Swagger
const swaggerDocument = setupSwagger(app)

// Set up Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Configure Routes
const routes: CommonRoutesConfig[] = [new OrdersRoutes(app)] // Initialize the routes

// Default route
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send(`Server running at http://localhost:${port}`)
})

// Error Handling middleware
app.use(errorHandler)

// Start the HTTP server
server.listen(port, async () => {
  // Connect to Redis
  const connection = new IORedis({maxRetriesPerRequest: null})
  /**
   * Create a new worker to process jobs from the quote-queue
   */
  new Worker(
    'quote-queue',
    async (job) => {
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
      try {
        logger.info('Worker received job', job.name, job.id)
        await delay(12000) // delay for 12 seconds to avoid rate limiting with distance API
        logger.info('Worker processing job', job.name, job.id)
        const result = await processQuotation(job.data, job.id as string)
        logger.info('Worker completed job', job.name, job.id)
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
        } else {
          await job.updateData({
            note: 'Quotation processed successfully',
            quoteId: result.quoteId,
            status: 'QUOTED',
          })
        }
      } catch (error) {
        // Log and handle errors within the worker
        logger.error('Error processing job', job.name, job.id, error)
      }
    },
    { connection },
  )

  // Log configured routes
  routes.forEach((route: CommonRoutesConfig) => {
    debugLog(`Routes configured for ${route.getName()}`)
  })
  console.log(
    `Server running at http://localhost:${port} - process ${process.pid}`,
  )
})
