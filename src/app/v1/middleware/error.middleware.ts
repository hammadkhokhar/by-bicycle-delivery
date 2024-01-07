import { Request, Response, NextFunction } from "express";
import { CustomError } from "../../../common/common.error.config";

/**
 * Custom error handler to standardize error objects returned to
 * the client.
 */
function handleError(
  err: TypeError | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Check if the error has a 'stack' property before logging
  if ("stack" in err) {
    console.error(`Error caught: ${err.message}`);
    console.error(`Stack trace: ${err.stack}`);
  }

  let customError = err;

  if (!(err instanceof CustomError)) {
    console.log(err.name);
    switch (err.name) {
      case "UnauthorizedError":
        customError = new CustomError(
          "Oh no, this is embarrassing. You're not allowed in here.",
          401,
        );
        break;
      default:
        customError = new CustomError("Are you lost?", 404);
        break;
    }
  }

  // Set the response content type to JSON
  res.status((customError as CustomError).status).json(customError);
}

export default handleError;
