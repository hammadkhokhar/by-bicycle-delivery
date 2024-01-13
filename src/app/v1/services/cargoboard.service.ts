import logger from '../utils/logger.util'
import { IOrder } from '../interfaces/orders.interface'
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

class CargoboardServices {
  /**
   * Get distance between shipper and consignee addresses.
   * @param {IOrder} orderRequest - The order details.
   * @returns {Promise<number>} - The distance between addresses.
   */
  async getDistance(orderRequest: IOrder): Promise<number> {
    try {
      const distanceRequestConfig =
        this.createDistanceRequestConfig(orderRequest)
      const response: number = (
        await this.makeDistanceRequest(distanceRequestConfig)
      ).data.distance
      return response
    } catch (error) {
      if (error instanceof AxiosError)
        logger.error(`Error getting distance: ${error.message}`)
      throw new Error('Error getting distance')
    }
  }

  private createDistanceRequestConfig(
    orderRequest: IOrder,
  ): AxiosRequestConfig {
    const url = `https://distance.staging.cargoboard.com/distances/${orderRequest.shipper.address.shipperCountry}/${orderRequest.shipper.address.shipperPostcode}/${orderRequest.consignee.address.consigneeCountry}/${orderRequest.consignee.address.consigneePostcode}`

    return {
      method: 'get',
      url,
      headers: {
        Authorization: `${process.env.CARGOBOARD_CREDENTIALS}`,
      },
    }
  }

  private async makeDistanceRequest(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse> {
    try {
      return await axios.request(config)
    } catch (error) {
      throw this.handleAxiosError(error as AxiosError)
    }
  }

  private handleAxiosError(error: AxiosError): Error {
    if (error.response) {
      logger.error(`Distance service error: ${error.response.data}`)
    } else if (error.request) {
      logger.error(`Distance service error: ${error.request}, ${error.message}`)
    } else {
      const errorMessage = (error as Error).message
      logger.error(`Distance service error: ${errorMessage}`)
    }
    return error
  }
}

export default CargoboardServices
