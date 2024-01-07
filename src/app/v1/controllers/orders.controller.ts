import { Request, Response, response } from "express";
import logger from "../middleware/logger.middleware";
/**
 * Controller class for handling orders-related requests.
 */
class OrdersController {
  async index(req: Request, res: Response): Promise<void> {
    res.status(200).send("API Services Healthy.");
  }

  async getQuotation(req: Request, res: Response): Promise<void> {
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
