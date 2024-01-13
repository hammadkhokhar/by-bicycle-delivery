import { Request, Response, NextFunction } from 'express'
import { CustomError } from '../../../common/common.error.config'

/**
 * Custom error handler to standardize error objects returned to
 * the client.
 */
function handleError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let customError: CustomError;
  customError = new CustomError(
    "Oh no, this is embarrassing. We're working on it.",
  );

  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    customError = new CustomError('Invalid JSON in request body', 400);
  } else if (!(err instanceof CustomError)) {
    console.log(err.name);
    switch (err.name) {
      case 'UnauthorizedError':
        customError = new CustomError(
          "Oh no, this is embarrassing. You're not allowed in here.",
          401,
        );
        break;
      case 'NotFoundError':
        customError = new CustomError('Are you lost?', 404);
        break;
      default:
        customError = new CustomError('Internal Server Error', 500);
        break;
    }
  }

  // Set the response content type to JSON
  res.status(customError.status).json(customError);
}

export default handleError;