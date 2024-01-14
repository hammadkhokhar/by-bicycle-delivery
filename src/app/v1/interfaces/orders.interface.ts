/**
 * Interface representing an order
 */
interface IOrder {
  shipper: {
    address: {
      shipperCountry: string
      shipperCity: string
      shipperPostcode: string
    }
    shipperPickupOn: Date
  }
  consignee: {
    address: {
      consigneeCountry: string
      consigneeCity: string
      consigneePostcode: string
    }
    consigneeDeliveryOn: Date
  }
}

export { IOrder }
