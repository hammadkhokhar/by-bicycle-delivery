import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import moment from 'moment-timezone'
moment.tz.setDefault('Europe/Berlin')
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import logger from '../utils/logger.util'
import { IOrder } from '../interfaces/orders.interface'
import CargoboardServices from '../services/cargoboard.service'
import { setRouteInRedis, checkRouteExistsInRedis } from './cache.helper'

/**
 * Calculates the delivery price based on the route length.
 *
 * @param routeLength - The length of the delivery route in kilometers.
 * @returns A promise that resolves to the calculated delivery price in EUR.
 */
export async function calculateDeliveryPrice(
  routeLength: number,
): Promise<number> {
  if (routeLength <= 50) {
    return 100
  } else if (routeLength <= 150) {
    return 200
  } else if (routeLength > 250) {
    return 300
  } else {
    return 0
  }
}

/**
 * Validates the length of a route.
 *
 * @param routeLength The length of the route to be validated.
 * @returns A promise that resolves to a boolean indicating whether the route length is valid.
 */
export async function validateRouteRange(distance: number) {
  const validatedDistance = z
    .object({ distance: z.number().min(3).max(300) })
    .safeParse({ distance: distance })

  return validatedDistance
}

/**
 * Export an asynchronous function to process a quotation for an order
 *
 * @param {IOrder} orderRequest - The order request object containing details of the shipment.
 * @returns {Promise<any>} A promise that resolves to the quotation response or an error.
 */
export async function processQuotation(
  orderRequest: IOrder,
  quoteId: string,
): Promise<any> {
  const cb = new CargoboardServices() // Create an instance of CargoboardServices
  let price: number = 0 // Initialize price variable

  try {
    // Step 1: Get Distance
    let routeDistance = await cb.getDistance(orderRequest)
    routeDistance=50
    // Step 2: Distance validation
    let routeDistanceValidation = await validateRouteRange(routeDistance)

    // If distance validation fails, return an error message
    if (!routeDistanceValidation.success) {
      return {
        error: {
          message:
            'The distance between the shipper and consignee is not in operational range.',
          distance: routeDistance,
          code: 422,
        },
      }
    }
    
    // Step 3: Calculate price
    price = await calculateDeliveryPrice(routeDistance)

    // Step 4: Check if there is an existing order with the same shipper, consignee, pickup date, and delivery date in Redis
    const pickupDateFormatted = moment(orderRequest.shipper.shipperPickupOn).format('YYYY-MM-DD');
    const deliverDateFormatted = moment(orderRequest.consignee.consigneeDeliveryOn).format('YYYY-MM-DD');

    const routeKey = `${orderRequest.shipper.address.shipperCountry}:${orderRequest.shipper.address.shipperCity}:${orderRequest.shipper.address.shipperPostcode}-to-${orderRequest.consignee.address.consigneeCountry}:${orderRequest.consignee.address.consigneeCity}:${orderRequest.consignee.address.consigneePostcode}-pickupOn-${pickupDateFormatted}-deliverOn-${deliverDateFormatted}`;

    const existingOrderInRedis = await checkRouteExistsInRedis(routeKey);

    // If there is an existing order, apply a 10 EUR discount
    price = existingOrderInRedis ? price - 10 : price;
 

    // Step 5: Convert price to cents
    price = price * 100

    /**
     * Step 6: Save order(quotation) to database
     */

    // Step 6a: Check if shipper already exists in the database
    const existingShipper = await prisma.shipper.findFirst({
      where: {
        shipperCountry: orderRequest.shipper.address.shipperCountry,
        shipperCity: orderRequest.shipper.address.shipperCity,
        shipperPostcode: orderRequest.shipper.address.shipperPostcode,
      },
    })

    // Step 6b: Check if consignee already exists in the database
    const existingConsignee = await prisma.consignee.findFirst({
      where: {
        consigneeCountry: orderRequest.consignee.address.consigneeCountry,
        consigneeCity: orderRequest.consignee.address.consigneeCity,
        consigneePostcode: orderRequest.consignee.address.consigneePostcode,
      },
    })

    // Step 6c: Create order with quotation status
    const order = await prisma.order.create({
      data: {
        shipper: existingShipper
          ? { connect: { id: existingShipper.id } } // Connect to existing shipper
          : {
              // Create a new shipper if it doesn't exist
              create: {
                shipperCountry: orderRequest.shipper.address.shipperCountry,
                shipperCity: orderRequest.shipper.address.shipperCity,
                shipperPostcode: orderRequest.shipper.address.shipperPostcode,
              },
            },
        consignee: existingConsignee
          ? { connect: { id: existingConsignee.id } } // Connect to existing consignee
          : {
              // Create a new consignee if it doesn't exist
              create: {
                consigneeCountry:
                  orderRequest.consignee.address.consigneeCountry,
                consigneeCity: orderRequest.consignee.address.consigneeCity,
                consigneePostcode:
                  orderRequest.consignee.address.consigneePostcode,
              },
            },
        shipperPickupOn: orderRequest.shipper.shipperPickupOn,
        consigneeDeliverOn: new Date(
          orderRequest.consignee.consigneeDeliveryOn,
        ),
        distance: routeDistance,
        price: price,
        quoteId: quoteId,
        placedAt: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      },
    })

    // Step 6d: Store route information in Redis if it doesn't exist
    if (!existingOrderInRedis) {
      await setRouteInRedis(routeKey)
    }

    // Step 7: Send response back to the client
    const responseBackToClient = {
      distance: routeDistance,
      price: price,
      quoteExpiry: moment().add(1, 'hour').valueOf(),
      quoteId: order.quoteId,
      status: 'QUOTED',
    }

    return responseBackToClient
  } catch (error) {
    // Step 8: Log the error
    logger.error('Order Quotation Endpoint', error)

    // Step 9: Return an error response
    return {
      error: {
        message: 'Internal Server Error',
        code: 500,
      },
    }
  }
}

// Adds a note to orders
export async function addOrderNote(id: number, note: string) {
  // update order with note
  const order = await prisma.order.update({
    where: { id },
    data: {
      Note: {
        create: {
          note,
        },
      },
    },
  })
  logger.info('Order Note add for order id: ' + id)
}

/**
 * Retrieve a quotation (order) by its unique quote ID.
 *
 * @param {string} id - The unique quote ID of the quotation to be retrieved.
 * @returns {Promise<any>} A promise that resolves to the retrieved quotation or null if not found.
 */
export async function getQuote(id: string): Promise<any> {
  try {
    // Fetch the order (quotation) from the database based on the provided quote ID
    const order = await prisma.order.findFirst({
      where: {
        quoteId: id,
      },
      include: {
        shipper: true,
        consignee: true,
      },
    })
    // Return the retrieved order (quotation)
    return order
  } catch (error) {
    // Log any errors that occur during the process
    logger.error('Get Quote', error)

    // Return an error response
    return {
      error: {
        message: 'Internal Server Error',
        code: 500,
      },
    }
  }
}
