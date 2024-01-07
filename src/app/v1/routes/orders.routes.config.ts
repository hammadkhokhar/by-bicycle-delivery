import { Application } from "express";
import { CommonRoutesConfig } from "../../../common/common.routes.config";
import ordersController from "../controllers/orders.controller";
import validationMiddleware from "../middleware/validation/order.validation";

/**
 * Class representing routes related to orders.
 * Extends CommonRoutesConfig for common route configuration.
 */
export class OrdersRoutes extends CommonRoutesConfig {
  /**
   * Creates an instance of OrdersRoutes.
   * @param {Application} app - Express application.
   */
  constructor(app: Application) {
    super(app, "OrdersRoutes");
  }

  /**
   * Configures routes for the orders-related functionalities.
   * @returns {Application} - Configured Express application.
   */
  configureRoutes(): Application {
    const routePrefix = "/api/v1/orders";

    // Index
    this.app.route(`${routePrefix}`).get(ordersController.index);

    // Quotation
    this.app
      .route(`${routePrefix}`)
      // validates all input fields in the request body
      .all(validationMiddleware.validateOrder())
      .post(ordersController.getQuotation);

    // Create order
    this.app
      .route(`${routePrefix}/:quotationId`)
      .all(validationMiddleware.validateOrder())
      .post(ordersController.createOrder);

    return this.app;
  }
}
