import {
  calculateDeliveryPrice,
  validateRouteRange,
} from '../helper/orders.helper'

/**
 * Delivery Price Calculator
 */
describe('Delivery Price Calculator', () => {
  it('should return 100 for route length <= 50', async () => {
    const routeLength = 50
    const result = await calculateDeliveryPrice(routeLength)
    expect(result).toBe(100)
  })

  it('should return 200 for route length <= 150', async () => {
    const routeLength = 150
    const result = await calculateDeliveryPrice(routeLength)
    expect(result).toBe(200)
  })

  it('should return 300 for route length > 250', async () => {
    const routeLength = 300
    const result = await calculateDeliveryPrice(routeLength)
    expect(result).toBe(300)
  })
})

/**
 * Route Range Validator
 */
describe('Route Range Validator', () => {
  it('should return validated distance object for distance between 3 and 300', async () => {
    const distance = 150
    const result = await validateRouteRange(distance)
    expect(result.success).toBe(true)
  })

  it('should return error for distance less than 3', async () => {
    const distance = 2
    const result = await validateRouteRange(distance)
    expect(result.success).toBe(false)
  })

  it('should return error for distance greater than 300', async () => {
    const distance = 350
    const result = await validateRouteRange(distance)
    expect(result.success).toBe(false)
  })
})
