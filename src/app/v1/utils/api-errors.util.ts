import { Response } from 'express'

function sendErrorResponse(
  res: Response,
  statusCode: number,
  message: string,
  data: any,
): void {
  res.status(statusCode).send({
    message,
    ...data,
  })
}

function sendSuccessResponse(
  res: Response,
  statusCode: number,
  message: string,
  data: any,
): void {
  res.status(statusCode).send({
    message,
    ...data,
  })
}

export { sendErrorResponse, sendSuccessResponse }
