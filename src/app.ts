import express from "express";
import * as http from "http";
import cors from "cors";
import errorHandler from "./app/v1/middleware/error.middleware";
import { CommonRoutesConfig } from "./common/common.routes.config";
import { OrdersRoutes } from "./app/v1/routes/orders.routes.config";
import debug from "debug";
import * as dotenv from "dotenv";
dotenv.config();

const app: express.Application = express();

// Create an HTTP server using the Express application
const server: http.Server = http.createServer(app);

// Set the port to use, defaulting to 80 or using the value from the environment
const port = process.env.PORT || 80;

// Debug logger for application-wide debugging
const debugLog: debug.IDebugger = debug("app");

// Middleware setup
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded requests
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// Configure Routes
const routes: CommonRoutesConfig[] = [new OrdersRoutes(app)]; // Initialize the routes

// Default route
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(`Server running at http://localhost:${port}`);
});

// Error Handling middleware
app.use(errorHandler);

// Start the HTTP server
server.listen(port, () => {
  // Log configured routes
  routes.forEach((route: CommonRoutesConfig) => {
    debugLog(`Routes configured for ${route.getName()}`);
  });
  console.log(`Server running at http://localhost:${port}`);
});