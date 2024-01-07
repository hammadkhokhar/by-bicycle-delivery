import { z, ZodError } from "zod";
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
    const checkForExtraProperties = (
      actual: Record<string, any>,
      expected: Record<string, any>,
    ): string[] => {
      const extraProperties: string[] = [];

      for (const prop in actual) {
        if (!expected.hasOwnProperty(prop)) {
          extraProperties.push(prop);
        } else if (
          typeof actual[prop] === "object" &&
          !Array.isArray(actual[prop]) &&
          actual[prop] !== null
        ) {
          // Recursively check nested objects
          const nestedExtraProperties = checkForExtraProperties(
            actual[prop],
            expected[prop],
          );
          extraProperties.push(
            ...nestedExtraProperties.map((np) => `${prop}.${np}`),
          );
        }
      }

      return extraProperties;
    };

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
            shipperPickupOn: z.string().refine(
              (value) => {
                const parsedDate = moment.utc(value, true);

                 // Check if the date is up to the current day only
                const formatValidation = parsedDate.isValid() && parsedDate.minutes() === 0 && parsedDate.seconds() === 0

                if(!formatValidation) {
                  return false
                }

                const currentHour = moment().hour();
                const currentMinute = moment().minute();
                const cutoffHour = 10;
                const cutoffMinute = 30;

                // Check if the date is up to the current day or next day based on placement time
                const isValid = parsedDate.isSameOrAfter(moment(), 'day') || (currentHour < cutoffHour || (currentHour === cutoffHour && currentMinute <= cutoffMinute))
                return isValid;
              },
              {
                message: `Invalid datetime format. Please use YYYY-MM-DDTHH:00:00Z format. Orders placed before 10:30 may have pickup time of the same day, but placed later must have pickup time on the next day or later.`,
              },
            ),
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
            consigneeDeliveryOn: z.string().refine(
              (value) => {
                // Check if the date is up to the current day only
                const currentDate = moment.utc().startOf("day");
                const inputDate = moment.utc(value, "YYYY-MM-DD", true);
                return inputDate.isSameOrAfter(currentDate);
              },
              {
                message: "Delivery date must be up to the current day.",
              },
            ),
          }),
        });

        const validatedData = await orderSchema.parseAsync(req.body);

        // Check for extra properties in req.body
        const extraProperties = checkForExtraProperties(
          req.body,
          validatedData,
        );

        if (extraProperties.length > 0) {
          throw new Error(
            `Invalid request body. Extra properties found: ${extraProperties.join(
              ", ",
            )}`,
          );
        }

        req.body = validatedData;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
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
