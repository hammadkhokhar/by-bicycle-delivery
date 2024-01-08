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
            "The current operational range exceeds our limits, which are set between 3km and 300km. ",
          distance: routeDistance,
          error: "Bad Request",
        });
        return;
      }

      // calculate price
      price = await calculateDeliveryPrice(routeDistance);

      // placed at with miliseconds and timezone
      const orderObject = {
        distance:routeDistance,
        price:price,
        quoteExpiry:moment().add(1, 'hour').valueOf(),
        quoteId: uuidv4(),
        status:"QUOTED",
      }

      try{
        // Order creation with quoted status
        await prisma.order.create({
          data: {
            shipper:{
              create:{
                shipperCountry:orderRequest.shipper.address.shipperCountry,
                shipperCity:orderRequest.shipper.address.shipperCity,
                shipperPostcode:orderRequest.shipper.address.shipperPostcode,
              }
            },
            consignee:{
              create:{
                consigneeCountry:orderRequest.consignee.address.consigneeCountry,
                consigneeCity:orderRequest.consignee.address.consigneeCity,
                consigneePostcode:orderRequest.consignee.address.consigneePostcode,
              }
            },
            shipperPickupOn:orderRequest.shipper.shipperPickupOn,
            consigneeDeliverOn:new Date(orderRequest.consignee.consigneeDeliveryOn),
            distance:routeDistance,
            price:price,
            quoteId: uuidv4(),
            placedAt:moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            status:"QUOTED"
          },
        });
      }catch(error){
        console.log(error)
      }

      res.status(200).send(orderObject);
    } catch (error) {
      logger.error("Quotation Service Error", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async processOrder(req: Request, res: Response): Promise<void> {
    logger.info("Request", {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    });
    res.status(200).send("Order created");
  }
}

export default new OrdersController();
