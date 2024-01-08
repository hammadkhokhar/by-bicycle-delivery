import request from 'supertest'
import express, { Application } from 'express'
import { OrdersRoutes } from '../routes/orders.routes.config'

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
  describe('GET /api/v1/orders/:quotationId', () => {
    it('Should get the status of the order', async () => {
      const quotationId = '463391ae-6e3e-431f-b9b5-62771037b8b6' // must be a valid quotationId from the database
      const response = await request(app).get(`/api/v1/orders/${quotationId}`)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
    })
  })

  /**
   * Process the order
   */
  describe('POST /api/v1/orders/:quotationId', () => {
    it('should process the order', async () => {
      const quotationId = '463391ae-6e3e-431f-b9b5-62771037b8b6' // must be a valid quotationId from the database
      const response = await request(app).post(`/api/v1/orders/${quotationId}`)
      if (response.body.message === 'No active quotation found') {
        expect(response.status).toBe(404)
      } else {
        expect(response.status).toBe(200)
      }
    })
  })
})
