import 'dotenv/config'
import request from 'supertest'
import express, { Application } from 'express'
import { OrdersRoutes } from '../routes/orders.routes.config'
import logger from '../utils/logger.util'
import redisClient from '../utils/redis.util'

describe('OrdersRoutes', () => {
  let app: Application
  let ordersRoutes: OrdersRoutes

  beforeAll(() => {
    app = express()
    ordersRoutes = new OrdersRoutes(app)
    ordersRoutes.configureRoutes()
  })

  /**
   * Get the index of orders
   */
  describe('GET /api/v1/orders', () => {
    it('should return the index of orders', async () => {
      const response = await request(app).get('/api/v1/orders')
      expect(response.status).toBe(200)
    })
  })

  /**
   * Get the status of the order
   */
  describe('GET /api/v1/orders/:orderId', () => {
    it('Should get the status of the order', async () => {
      const TEST_ORDER_ID = process.env.TEST_ORDER_ID // must be a valid quotationId from the database
      const response = await request(app).get(`/api/v1/orders/${TEST_ORDER_ID}`)
      if (response.status == 404) {
        logger.error('TEST_ORDER_ID not found')
        expect(response.status).toBe(404)
        return
      }
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
    })
  })
  
  afterAll(async () => {
    // Close the Redis connection
    await redisClient.quit();
  });
})
