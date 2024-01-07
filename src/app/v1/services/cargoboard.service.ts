import logger from "../middleware/logger.middleware";
import { IOrder } from "../interfaces/orders.interface";
import axios, { AxiosRequestConfig } from "axios";
/**
 * CargoboardServices class handles communication with the distance service.
 */
class CargoboardServices {
  /**
   * Get distance between shipper and consignee addresses.
   * @param {IOrder} orderRequest - The order details.
   * @returns {Promise<number>} - The distance between addresses.
   */
  async getDistance(orderRequest: IOrder): Promise<number> {
    const distanceRequestConfig: AxiosRequestConfig = {
      method: "get",
      url: `https://distance.staging.cargoboard.com/distances/${orderRequest.shipper.address.shipperCountry}/${orderRequest.shipper.address.shipperPostcode}/${orderRequest.consignee.address.consigneeCountry}/${orderRequest.consignee.address.consigneePostcode}`,
      headers: {
        Authorization: `${process.env.CARGOBOARD_CREDENTIALS}`,
      },
    };

    try {
      // make request to distance service
      const response = await axios.request(distanceRequestConfig);

      // get distance from response
      const distance: number = response.data.distance;

      return distance;
    } catch (error) {
      // Log error
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          logger.error(`Distance service: ${error.response.data}`);
        } else if (error.request) {
          // The request was made but no response was received
          logger.error(`Distance service: ${error.request}, ${error.message}`);
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        const errorMessage = (error as Error).message;
        logger.error(`Distance service: ${errorMessage}`);
      }
      return 0;
    }
  }
}

export default CargoboardServices;
