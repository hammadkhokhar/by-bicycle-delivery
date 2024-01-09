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

/**
 * Calculates the delivery price based on the route length.
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
 * @param routeLength The length of the route to be validated.
 * @returns A promise that resolves to a boolean indicating whether the route length is valid.
 */
export async function validateRouteRange(distance: number) {
  const validatedDistance = z
    .object({ distance: z.number().min(3).max(300) })
    .safeParse({ distance: distance })

  return validatedDistance
}

export async function processQuotation(orderRequest: IOrder): Promise<any> {
  const cb = new CargoboardServices() // Create an instance of CargoboardServices
  let price: number = 0
  try {
    // Get Distance
    let routeDistance = await cb.getDistance(orderRequest)

    // Distance validation
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

    // calculate price
    let price: number = await calculateDeliveryPrice(routeDistance)

    // Check if there is an existing order with the same shipper, consignee, pickup date
    const pickupDay = moment(orderRequest.shipper.shipperPickupOn).startOf(
      'day',
    )
    const orderCount = await prisma.order.count({
      where: {
        shipperPickupOn: {
          gte: pickupDay.toDate(),
          lt: pickupDay.clone().add(1, 'day').toDate(),
        },
        shipper: {
          shipperCountry: orderRequest.shipper.address.shipperCountry,
          shipperCity: orderRequest.shipper.address.shipperCity,
          shipperPostcode: orderRequest.shipper.address.shipperPostcode,
        },
        consignee: {
          consigneeCountry: orderRequest.consignee.address.consigneeCountry,
          consigneeCity: orderRequest.consignee.address.consigneeCity,
          consigneePostcode: orderRequest.consignee.address.consigneePostcode,
        },
      },
    })

    // If there is an existing order, apply a 10 EUR discount
    price = orderCount > 0 ? price - 10 : price

    // Convert price to cents
    price = price * 100

    /**
     * Save order(quotation) to database
     */
    // Check if shipper already exist in database
    const existingShipper = await prisma.shipper.findFirst({
      where: {
        shipperCountry: orderRequest.shipper.address.shipperCountry,
        shipperCity: orderRequest.shipper.address.shipperCity,
        shipperPostcode: orderRequest.shipper.address.shipperPostcode,
      },
    })

    // Check if consignee already exist in database
    const existingConsignee = await prisma.consignee.findFirst({
      where: {
        consigneeCountry: orderRequest.consignee.address.consigneeCountry,
        consigneeCity: orderRequest.consignee.address.consigneeCity,
        consigneePostcode: orderRequest.consignee.address.consigneePostcode,
      },
    })

    // Create order with quotation status
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
        quoteId: uuidv4(),
        placedAt: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      },
    })

    // Send response back to the client
    const responseBackToClient = {
      distance: routeDistance,
      price: price,
      quoteExpiry: moment().add(1, 'hour').valueOf(),
      quoteId: order.quoteId,
      status: 'QUOTED',
    }

    return responseBackToClient
  } catch (error) {
    // Log the error
    logger.error('Order Quoation Endpoint', error)

    // Return an error response
    return {
      error: {
        message: 'Internal Server Error',
        code: 500,
      },
    }
  }
}
