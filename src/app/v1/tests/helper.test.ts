import {
  calculateDeliveryPrice,
  processQuotation,
  validateRouteRange,
} from '../helper/orders.helper'
import axios from 'axios'

jest.mock('axios')

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

jest.mock('axios')

/**
 * Quotation Processor
 */
describe('Quotation Processor', () => {
  afterEach(() => {
    jest.restoreAllMocks() // Restore all mocks after each test
  })

  const orderRequest = {
    shipper: {
      address: {
        shipperCountry: 'DE',
        shipperCity: 'Potsdam',
        shipperPostcode: '10115',
      },
      shipperPickupOn: '2024-01-09T20:00:00Z',
    },
    consignee: {
      address: {
        consigneeCountry: 'PL',
        consigneeCity: 'Słupsk',
        consigneePostcode: '76-200',
      },
      consigneeDeliveryOn: '2024-01-23',
    },
  }

  // Mock the Axios request
  const axiosMock = jest.spyOn(axios, 'request')

  it('should return unprocessable', async () => {
    const mockedDistanceResponseInvalid = {
      data: {
        distance: 400,
      },
    }
    // Mocked Axios response for the distance service
    axiosMock.mockResolvedValue(mockedDistanceResponseInvalid)

    const result = await processQuotation(orderRequest)
    expect(result.error.code).toBe(422)
  })

  it('should return success', async () => {
    const mockedDistanceResponseValid = {
      data: {
        distance: 100,
      },
    }

    // Mocked Axios response for the distance service
    axiosMock.mockResolvedValue(mockedDistanceResponseValid)

    // Test the processQuotation function
    const result = await processQuotation(orderRequest)
    expect(result.status).toBe('QUOTED')
  })
})
