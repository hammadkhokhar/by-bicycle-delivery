import "dotenv/config";
import { Request, Response, response } from "express";
import { v4 as uuidv4 } from "uuid";
import moment from 'moment-timezone';
moment.tz.setDefault('Europe/Berlin');
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import logger from "../middleware/logger.middleware";
import { IOrder } from "../interfaces/orders.interface";
import {
  calculateDeliveryPrice,
  validateRouteRange,
} from "../helper/orders.helper";
import CargoboardServices from "../services/cargoboard.service";

/**
 * Controller class for handling orders-related requests.
 */
class OrdersController {
  async index(req: Request, res: Response): Promise<void> {
    res.status(200).send("API Services Healthy.");
  }

  /**
   * Handles the request to get a quotation for an order.
   */
  async getQuotation(req: Request, res: Response): Promise<void> {
    // Log request information
    logger.info("Request", {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    });

    const cb = new CargoboardServices(); // Create an instance of CargoboardServices
    const orderRequest: IOrder = req.body; // Extract order information from the request body
    let price: number = 0;

    try {
      // Get Distance
      let routeDistance = await cb.getDistance(orderRequest);

      // For testing purposes, overwrite routeDistance with a fixed value
      routeDistance = 50;

      // Distance validation
      let routeDistanceValidation = await validateRouteRange(routeDistance);

      // If distance validation fails, send error message
      if (!routeDistanceValidation.success) {
        res.status(422).send({
          message:
            "The distance between the shipper and consignee is too far. Limit: 3-300km",
          distance: routeDistance,
          error: "Bad Request",
        });
        return;
      }

      // calculate price
      price = await calculateDeliveryPrice(routeDistance);

      try{
        /**
         * Check if there is an existing order with the same shipper, consignee, pickup date
         */
        const pickupDay = moment(orderRequest.shipper.shipperPickupOn).startOf('day');
        const orderCount = await prisma.order.count({
          where:{
            shipperPickupOn: {
              gte: pickupDay.toDate(),             
              lt: pickupDay.clone().add(1, 'day').toDate(),
            },
            shipper:{
              shipperCountry:orderRequest.shipper.address.shipperCountry,
              shipperCity:orderRequest.shipper.address.shipperCity,
              shipperPostcode:orderRequest.shipper.address.shipperPostcode,
            },
            consignee:{
              consigneeCountry:orderRequest.consignee.address.consigneeCountry,
              consigneeCity:orderRequest.consignee.address.consigneeCity,
              consigneePostcode:orderRequest.consignee.address.consigneePostcode,
            }
          }
        });

        // If there is an existing order, apply a 10 EUR discount
        price = orderCount > 0 ? price - 10 : price;

        // Convert price to cents
        price = price * 100;

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
        });
        
        // Check if consignee already exist in database
        const existingConsignee = await prisma.consignee.findFirst({
          where: {
            consigneeCountry: orderRequest.consignee.address.consigneeCountry,
            consigneeCity: orderRequest.consignee.address.consigneeCity,
            consigneePostcode: orderRequest.consignee.address.consigneePostcode,
          },
        });
        
        // Create order with quotation status
        const order = await prisma.order.create({
          data: {
            shipper: existingShipper
              ? { connect: { id: existingShipper.id } } // Connect to existing shipper
              : { // Create a new shipper if it doesn't exist
                  create: {
                    shipperCountry: orderRequest.shipper.address.shipperCountry,
                    shipperCity: orderRequest.shipper.address.shipperCity,
                    shipperPostcode: orderRequest.shipper.address.shipperPostcode,
                  },
                },
            consignee: existingConsignee
              ? { connect: { id: existingConsignee.id } } // Connect to existing consignee
              : { // Create a new consignee if it doesn't exist
                  create: {
                    consigneeCountry: orderRequest.consignee.address.consigneeCountry,
                    consigneeCity: orderRequest.consignee.address.consigneeCity,
                    consigneePostcode: orderRequest.consignee.address.consigneePostcode,
                  },
                },
            shipperPickupOn: orderRequest.shipper.shipperPickupOn,
            consigneeDeliverOn: new Date(orderRequest.consignee.consigneeDeliveryOn),
            distance: routeDistance,
            price: price,
            quoteId: uuidv4(),
            placedAt: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
          }
        });

        /**
         * Send response back to client
         */
        const responseBackToClient = {
          distance:routeDistance,
          price:price,
          quoteExpiry:moment().add(1, 'hour').valueOf(),
          quoteId: order.quoteId,
          status:"QUOTED",
        }

        res.status(201).send(responseBackToClient);
      } catch (error) {
        logger.error("Order Creation", error);
        res.status(500).send("Internal Server Error");
      }
    } catch (error) {
      /**
       * If any error occurs, log the error and send a 500 response.
       */
      logger.error("Order Quoation Endpoint", error);
      res.status(500).send("Internal Server Error");
    }
  }

  /**
   * Handles the request to create an order
   */
  async processOrder(req: Request, res: Response): Promise<void> {
    logger.info("Request", {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    });

    /**
     * Get order from database
     */
    const getOrder = await prisma.order.findFirst({
      where: {
        quoteId: req.params.quotationId,
        status: "QUOTED",
      },
      include:{
        shipper:true,
        consignee:true
      }
    });

    /**
     * If order is not found, send error message
     */
    if (!getOrder) {
      res.status(404).send({
        message: "No active quotation found",
        error: "Not Found",
      });
      return;
    }

    /**
     * If quotation has expired, send error message
     */
    if(moment(getOrder.placedAt).add(1, 'hour').isBefore(moment())){
      res.status(422).send({
        message: "Quote has expired, please request a new quote or contact us.",
        error: "Bad Request",
      });
      return;
    }

    /**
     * Update order status
     */
    const updateOrder = await prisma.order.update({
      where:{
        quoteId: req.params.quotationId
      },
      data:{
        status: "BOOKED"
      }
    });

    // Send response back to client
    res.status(200).send({
      message: "Booking successful.",
      quoteId: updateOrder.quoteId,
      status: "BOOKED",
    });
  }

  /**
   * Handles the request to retrieve an order
   */
  async getOrder(req: Request, res: Response): Promise<void> {
    // Log request information
    logger.info("Request", {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    });
    /**
     * Get order from database
     */
    const order = await prisma.order.findFirst({
      where: {
        quoteId: req.params.quotationId,
      },
      include:{
        shipper:true,
        consignee:true
      }
    });

    /**
     * If order is not found, send error message
     */
    if (!order) {
      res.status(404).send({
        message: "Order not found",
        error: "Not Found",
      });
      return;
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
      status: order.status
    };

    res.status(200).send(responseBackToClient);
  }
}

export default new OrdersController();
