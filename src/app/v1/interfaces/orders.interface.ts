/**
 * Interface representing an order
 */
interface IOrder {
  shipper: {
    address: {
      shipperCountry: string;
      shipperCity: string;
      shipperPostcode: string;
    };
    shipperPickupOn: string;
  };
  consignee: {
    address: {
      consigneeCountry: string;
      consigneeCity: string;
      consigneePostcode: string;
    };
    consigneeDeliveryOn: string;
  };
}

export { IOrder };
