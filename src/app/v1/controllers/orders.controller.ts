import 'dotenv/config'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import moment from 'moment-timezone'
moment.tz.setDefault('Europe/Berlin')
import prisma from '../utils/prisma.util'
import logger from '../utils/logger.util'
import {
  sendErrorResponse,
  sendSuccessResponse,
} from '../utils/api-errors.util'
import { getQuote } from '../helper/orders.helper'
import { quoteQueue } from '../services/queue'

// Enum for order status
enum QuoteStatus {
  Quoted = 'QUOTED',
  Pending = 'PENDING',
  Booked = 'BOOKED',
}

/**
 * Controller class for handling orders-related requests.
 */
class OrdersController {
  /**
   * Handles the request to get the status of the API.
   */
  async index(req: Request, res: Response): Promise<void> {
    res.status(200).send('API Services Healthy.')
  }

  /**
   * Queues the request to get a quotation for an order.
   */
  async queueQuotation(req: Request, res: Response): Promise<void> {
    // Log request information
    logger.info('Request', {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    })

    // request id for logging
    const requestID = uuidv4()

    try {
      // Add request to queue
      const queueRes = await quoteQueue.add('Get Quote', req.body, {
        jobId: uuidv4(),
      })

      // log queue response
      logger.info('Queue ID', { queueId: queueRes.id, requestID })

      sendErrorResponse(
        res,
        200,
        'We have received your request. Quote will be available once processed, you can check the status using the quote id.',
        { quoteId: queueRes.id },
      )
    } catch (error) {
      logger.error('Error adding to BullMQ queue:', error, requestID)
      sendErrorResponse(res, 500, requestID, { error: 'Internal Server Error' })
    }
  }

  /**
   * Get the status of queued request
   */
  async getQuotation(req: Request, res: Response): Promise<void> {
    // Log request information
    logger.info('Request', {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    })

    const quoteIdSchema = z.string().uuid()
    const quoteIdValidation = quoteIdSchema.safeParse(req.params.quoteId)

    // If quoteId is not uuid, send error message
    if (!quoteIdValidation.success) {
      sendErrorResponse(res, 422, 'Invalid quote id', { error: 'Bad Request' })
      return
    }

    // Get queue status
    const queueRes = await quoteQueue.getJob(req.params.quoteId)

    // Check if the job is completed
    const isCompleted = await queueRes?.isCompleted()

    // Response if the job is completed
    if (isCompleted && queueRes?.data.status === QuoteStatus.Quoted) {
      let quoteDetails = await getQuote(req.params.quoteId)
      if (quoteDetails == null) {
        sendErrorResponse(res, 404, 'No active quotation found', {
          error: 'Not Found',
        })
        return
      }
      res.status(200).send({
        quoteId: quoteDetails.quoteId,
        shipper: {
          shipperCountry: quoteDetails.shipper.shipperCountry,
          shipperCity: quoteDetails.shipper.shipperCity,
          shipperPostcode: quoteDetails.shipper.shipperPostcode,
        },
        consignee: {
          consigneeCountry: quoteDetails.consignee.consigneeCountry,
          consigneeCity: quoteDetails.consignee.consigneeCity,
          consigneePostcode: quoteDetails.consignee.consigneePostcode,
        },
        shipperPickupOn: quoteDetails.shipperPickupOn,
        consigneeDeliverOn: quoteDetails.consigneeDeliverOn,
        distance: quoteDetails.distance,
        price: quoteDetails.price,
        status: quoteDetails.status,
      })
      return
    }

    // response if queue is not found
    if (!queueRes) {
      sendErrorResponse(res, 404, 'No active quotation found', {
        error: 'Not Found',
      })
      return
    } else if (queueRes.data.code === 422) {
      res.status(422).send(queueRes.data)
      return
    } else {
      // Get estimated time to complete based on the position of the job in the queue
      const waitingJobs = await quoteQueue.getWaiting()
      const position =
        waitingJobs.findIndex(
          (waitingJob) => waitingJob.id === req.params.quoteId,
        ) + 1
      const estimatedTimeToComplete = position * 12 // Each job has a delay of 12 seconds
      const estimatedTimeToCompleteTimestamp = moment()
        .add(estimatedTimeToComplete, 'seconds')
        .valueOf()

      // Response if the job is pending
      sendSuccessResponse(
        res,
        200,
        'Quotation is being processed, please check back later.',
        {
          quoteId: queueRes.id,
          estimatedCompletionTime: estimatedTimeToCompleteTimestamp,
          status: QuoteStatus.Pending,
        },
      )
    }
  }

  /**
   * Handles the request to book an order
   */
  async processOrder(req: Request, res: Response): Promise<void> {
    logger.info('Request', {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    })
    // check if quoteId is uuid with zod
    const quoteIdSchema = z.string().uuid()
    const quoteIdValidation = quoteIdSchema.safeParse(req.params.quoteId)

    // If quoteId is not uuid, send error message
    if (!quoteIdValidation.success) {
      sendErrorResponse(res, 422, 'Invalid quote id', { error: 'Bad Request' })
      return
    }

    /**
     * Get order from database
     */
    const getOrder = await prisma.order.findFirst({
      where: {
        quoteId: quoteIdValidation.data,
        status: QuoteStatus.Quoted,
      },
      include: {
        shipper: true,
        consignee: true,
      },
    })

    /**
     * If order is not found, send error message
     */
    if (!getOrder) {
      sendErrorResponse(res, 404, 'Order not found', { error: 'Not Found' })
      return
    }

    /**
     * Update order status
     */
    const updateOrder = await prisma.order.update({
      where: {
        quoteId: quoteIdValidation.data,
      },
      data: {
        status: QuoteStatus.Booked,
        lastModifiedAt: new Date(),
        placedAt: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      },
    })

    // Send response back to client
    sendSuccessResponse(res, 200, 'Booking successful.', {
      orderId: updateOrder.id,
      quoteId: updateOrder.quoteId,
      status: updateOrder.status,
    })
  }

  /**
   * Handles the request to retrieve an order
   */
  async getOrder(req: Request, res: Response): Promise<void> {
    // Log request information
    logger.info('Request', {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    })

    const orderId = req.params.orderId

    if (isNaN(Number(orderId))) {
      sendErrorResponse(res, 422, 'Invalid order id', { error: 'Bad Request' })
      return
    }

    /**
     * Get order from database
     */
    const order = await prisma.order.findFirst({
      where: {
        id: Number(req.params.orderId),
      },
      include: {
        shipper: true,
        consignee: true,
      },
    })

    /**
     * If order is not found, send error message
     */
    if (!order) {
      sendErrorResponse(res, 404, 'Order not found', { error: 'Not Found' })
      return
    }

    /**
     * Send response back to client
     */
    const responseBackToClient = {
      shipper: {
        shipperCountry: order.shipper.shipperCountry,
        shipperCity: order.shipper.shipperCity,
        shipperPostcode: order.shipper.shipperPostcode,
      },
      consignee: {
        consigneeCountry: order.consignee.consigneeCountry,
        consigneeCity: order.consignee.consigneeCity,
        consigneePostcode: order.consignee.consigneePostcode,
      },
      shipperPickupOn: order.shipperPickupOn,
      consigneeDeliverOn: order.consigneeDeliverOn,
      distance: order.distance,
      price: order.price,
      quoteId: order.quoteId,
      status: order.status,
    }

    sendSuccessResponse(res, 200, 'Order Active', responseBackToClient)
  }
}

export default new OrdersController()
