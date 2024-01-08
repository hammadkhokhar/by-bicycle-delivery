import { z } from 'zod'

/**
 * Calculates the delivery price based on the route length.
 * @param routeLength - The length of the delivery route in kilometers.
 * @returns A promise that resolves to the calculated delivery price in EUR.
 */
export async function calculateDeliveryPrice(
  routeLength: number,
): Promise<number> {
  if (routeLength <= 50) {
    return 100
  } else if (routeLength <= 150) {
    return 200
  } else if (routeLength > 250) {
    return 300
  } else {
    return 0
  }
}

/**
 * Validates the length of a route.
 * @param routeLength The length of the route to be validated.
 * @returns A promise that resolves to a boolean indicating whether the route length is valid.
 */
export async function validateRouteRange(distance: number) {
  const validatedDistance = z
    .object({ distance: z.number().min(3).max(300) })
    .safeParse({ distance: distance })

  return validatedDistance
}
