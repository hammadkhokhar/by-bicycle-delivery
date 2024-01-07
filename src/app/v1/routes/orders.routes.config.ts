import { Application } from "express";
import { CommonRoutesConfig } from "../../../common/common.routes.config";
import ordersController from "../controllers/orders.controller";
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

    // health
    this.app.route(`${routePrefix}`).get(ordersController.index);
    return this.app;
  }
}
