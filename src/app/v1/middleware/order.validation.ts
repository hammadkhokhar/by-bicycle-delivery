import { z, ZodError, ZodIssue } from 'zod'
import moment from 'moment'
import { Request, Response, NextFunction } from 'express'
import { IOrder } from '../interfaces/orders.interface'
/**
 * Middleware for validating incoming requests.
 */
class ValidationMiddleware {
  /**
   * Validates the body of a request against a given schema.
   * @returns A middleware function.
   */
  validateOrder() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const payloadSizeInBytes = Buffer.from(JSON.stringify(req.body)).length
      // Check if the payload size exceeds a certain limit
      if (payloadSizeInBytes > 300) {
        res.status(400).json({ error: 'Request payload size is too large.' })
        return
      }
      try {
        const allowedCountries = [
          'DE',
          'DK',
          'PL',
          'CZ',
          'AT',
          'CH',
          'FR',
          'BE',
          'NL',
        ]
        const orderSchema = z
          .strictObject({
            shipper: z.strictObject({
              address: z.strictObject({
                shipperCountry: z
                  .string()
                  .length(2)
                  .refine((value) => allowedCountries.includes(value), {
                    message: `Invalid Country Code. Allowed values are: ${allowedCountries.join(
                      ', ',
                    )}.`,
                  }),
                shipperCity: z.string(),
                shipperPostcode: z.string(),
              }),
              shipperPickupOn: z.string().datetime(),
            }),
            consignee: z.strictObject({
              address: z.strictObject({
                consigneeCountry: z
                  .string()
                  .length(2)
                  .refine((value) => allowedCountries.includes(value), {
                    message: `Invalid Country Code. Allowed values are: ${allowedCountries.join(
                      ', ',
                    )}.`,
                  }),
                consigneeCity: z.string(),
                consigneePostcode: z.string(),
              }),
              consigneeDeliveryOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            }),
          })
          .superRefine((value, ctx) => {
            /**
             * Case: when the difference is less than 2 or more than 7 days.
             */
            const pickupDate = moment.utc(
              value.shipper.shipperPickupOn,
              'YYYY-MM-DDTHH:mm:ssZ',
            )
            const deliveryDate = moment.utc(
              value.consignee.consigneeDeliveryOn,
              'YYYY-MM-DD',
            )
            const difference = deliveryDate.diff(pickupDate, 'days')
            if (difference < 2) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  'At least 2 days are required between expected pickup and delivery.',
                path: ['consignee', 'consigneeDeliveryOn'],
              })
            } else if (difference > 7) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  'At max 7 days are allowed between expected pickup and delivery.',
                path: ['consignee', 'consigneeDeliveryOn'],
              })
            }
            /**
             * Case: Orders placed before 10:30 may have pickup time of same day, but placed later have to be picked up next day or later.
             */
            const currentHour = moment().hour()
            const currentMinute = moment().minute()
            const cutoffHour = 10
            const cutoffMinute = 30
            const pickupDateIsSameDay = pickupDate.isSame(moment(), 'day')
            if (
              pickupDateIsSameDay &&
              (currentHour >= cutoffHour ||
                (currentHour === cutoffHour && currentMinute >= cutoffMinute))
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  'Orders placed after 10:30 must have pickup time on the next day or later.',
                path: ['shipper', 'shipperPickupOn'],
              })
            }
            /**
             * Case: Pickup date must be in the future and format must be YYYY-MM-DDTHH:mm:ssZ.
             */
            const parsedPickupDateTime = new Date(value.shipper.shipperPickupOn)
            if (
              isNaN(parsedPickupDateTime.getTime()) ||
              parsedPickupDateTime.getMinutes() !== 0 ||
              parsedPickupDateTime.getSeconds() !== 0 ||
              parsedPickupDateTime < new Date()
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  'Format must be YYYY-MM-DDTHH:00:00Z and date must be in the future.',
                path: ['shipper', 'shipperPickupOn'],
              })
            }
            /**
             * Case: Pickup time must be between 8:00 and 18:00 and Allowed days are days from Monday till Friday
             */
            const pickupDateDay = parsedPickupDateTime.getDay()
            const pickupDateIsWeekend =
              pickupDateDay === 0 || pickupDateDay === 6
            if (pickupDateIsWeekend) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  'Pickup allowed days are days from Monday till Friday.',
                path: ['shipper', 'shipperPickupOn'],
              })
            }
          })

        const validatedData = await orderSchema.parseAsync(req.body)

        req.body = validatedData
        next()
      } catch (error) {
        if (error instanceof ZodError) {
          // Handle ZodError cases
          const issues = error.issues.map((issue: ZodIssue) => ({
            path: issue.path,
            message: issue.message,
          }))
          res.status(400).json({ errors: issues })
        } else {
          const errorMessage = (error as Error).message
          res.status(400).json({ error: errorMessage })
        }
      }
    }
  }
}

export default new ValidationMiddleware()
