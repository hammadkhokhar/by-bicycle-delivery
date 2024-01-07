import { Request, Response, response } from "express";
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

  async getQuotation(req: Request, res: Response): Promise<void> {
    const cb = new CargoboardServices();

    // Log request
    logger.info("Request", {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    });
    const orderRequest: IOrder = req.body;

    let distance: number = 0,
      price: number = 0;

    try {
      // Get Distance
      let routeDistance = await cb.getDistance(orderRequest);

      routeDistance = 50;

      // Distance validation
      let routeDistanceValidation = await validateRouteRange(routeDistance);

      // If distance validation fails, send error message
      if (!routeDistanceValidation.success) {
        res.status(400).send({
          message:
            "The current operational range exceeds our limits, which are set between 3km and 300km. ",
          distance: distance,
          error: "Bad Request",
        });
        return;
      }

      // calculate price
      price = await calculateDeliveryPrice(distance);

      res.status(200).send("Quotation");
    } catch (error) {
      logger.error("Quotation Service Error", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    logger.info("Request", {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body,
    });
    res.status(200).send("Order created");
  }
}

export default new OrdersController();
