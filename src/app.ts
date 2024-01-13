import 'dotenv/config'
import express from 'express'
import * as http from 'http'
import cors from 'cors'
import { setupSwagger } from './app/v1/helper/swagger.helper'
import debug from 'debug'
import swaggerUi from 'swagger-ui-express'
import IORedis from 'ioredis'
import queueWorker from './app/v1/services/queue-worker'
import errorHandler from './app/v1/utils/error.util'
import { CommonRoutesConfig } from './common/common.routes.config'
import { OrdersRoutes } from './app/v1/routes/orders.routes.config'
import logger from './app/v1/utils/logger.util'
import redisClient from './app/v1/utils/redis.util'

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
  // queue worker configuration
  const queueProcessor = queueWorker(redisClient)
  queueProcessor.on('completed', (job) => {
    logger.info(`Job completed: ${job.id}`)
  })
  queueProcessor.on('failed', (job, err) => {
    logger.error(`Job failed: ${job?.id}`, err)
  })

  logger.info('Queue worker configured and started')

  // Log configured routes
  routes.forEach((route: CommonRoutesConfig) => {
    logger.info(`Routes configured for ${route.getName()}`)
  })

  console.log(
    `Server running at http://localhost:${port} - process ${process.pid}`,
  )
})
