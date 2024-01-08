import { z, ZodError, ZodIssue } from "zod";
import moment from "moment";
import { Request, Response, NextFunction } from "express";
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
      try {
        const allowedCountries = [
          "DE",
          "DK",
          "PL",
          "CZ",
          "AT",
          "CH",
          "FR",
          "BE",
          "NL",
        ];
        const orderSchema = z.object({
          shipper: z.object({
            address: z.object({
              shipperCountry: z
                .string()
                .length(2)
                .refine((value) => allowedCountries.includes(value), {
                  message: `Invalid Country Code. Allowed values are: ${allowedCountries.join(
                    ", ",
                  )}.`,
                }),
              shipperCity: z.string(),
              shipperPostcode: z.string(),
            }),
            shipperPickupOn: z.string().datetime()
          }),
          consignee: z.object({
            address: z.object({
              consigneeCountry: z
                .string()
                .length(2)
                .refine((value) => allowedCountries.includes(value), {
                  message: `Invalid Country Code. Allowed values are: ${allowedCountries.join(
                    ", ",
                  )}.`,
                }),
              consigneeCity: z.string(),
              consigneePostcode: z.string(),
            }),
            consigneeDeliveryOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
          })
        }).superRefine((value, ctx) => {
          /**
           * Case: when the difference is less than 2 or more than 7 days.
           */          
          const pickupDate = moment.utc(value.shipper.shipperPickupOn, "YYYY-MM-DDTHH:mm:ssZ");
          const deliveryDate = moment.utc(value.consignee.consigneeDeliveryOn, "YYYY-MM-DD");
          const difference = deliveryDate.diff(pickupDate, "days");
          if (difference < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "At least 2 days are required between expected pickup and delivery.",
              path: ["consignee", "consigneeDeliveryOn"],
            });
          } else if (difference > 7) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "At max 7 days are allowed between expected pickup and delivery.",
              path: ["consignee", "consigneeDeliveryOn"],
            });
          }
          /**
           * Case: Orders placed before 10:30 may have pickup time of same day, but placed later have to be picked up next day or later.
           */ 
          const currentHour = moment().hour();
          const currentMinute = moment().minute();
          const cutoffHour = 10;
          const cutoffMinute = 30;
          const pickupDateIsSameDay = pickupDate.isSame(moment(), 'day');
          if (pickupDateIsSameDay && (currentHour >= cutoffHour || (currentHour === cutoffHour && currentMinute >= cutoffMinute))) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Orders placed after 10:30 must have pickup time on the next day or later.",
              path: ["shipper", "shipperPickupOn"],
            });
          }
          /**
           * Case: Pickup date must be in the future and format must be YYYY-MM-DDTHH:mm:ssZ.
           */
          const parsedPickupDateTime = new Date(value.shipper.shipperPickupOn);
          if (
            isNaN(parsedPickupDateTime.getTime()) ||
            parsedPickupDateTime.getMinutes() !== 0 ||
            parsedPickupDateTime.getSeconds() !== 0 ||
            parsedPickupDateTime < new Date()
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Format must be YYYY-MM-DDTHH:00:00Z and date must be in the future.",
              path: ["shipper", "shipperPickupOn"],
            });
          }
          /**
           * Case: Pickup time must be between 8:00 and 18:00 and Allowed days are days from Monday till Friday
           */
          const pickupDateHour = parsedPickupDateTime.getHours();
          const pickupDateDay = parsedPickupDateTime.getDay();
          const pickupDateIsWeekend = pickupDateDay === 0 || pickupDateDay === 6;
          const pickupDateIsAfter18 = pickupDateHour >= 18;
          if (pickupDateIsWeekend || pickupDateIsAfter18) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Pickup time must be before 22:00 and Allowed days are days from Monday till Friday.",
              path: ["shipper", "shipperPickupOn"],
            });
          }
        });

        const validatedData = await orderSchema.parseAsync(req.body);
        req.body = validatedData;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const additionalProperties = error.errors.filter((err) => err.path.length === 1 && err.path[0] === '');
          if (additionalProperties.length > 0) {
            // Custom error message for additional properties
            const errorMessage = `Invalid properties in request body: ${additionalProperties.map((prop) => `"${prop.message}"`).join(', ')}`;
            return res.status(400).json({ error: errorMessage });
          }

          // Handle other ZodError cases
          res.status(400).json({ errors: error });
        } else {
          const errorMessage = (error as Error).message;
          res.status(400).json({ error: errorMessage });
        }
      }
    };
  }
}

export default new ValidationMiddleware();
