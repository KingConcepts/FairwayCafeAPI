class IOrder {
  orderId: Number;
  totalQuantity: Number;
  totalTaxAmount: String;
  total: String;
  subTotal: String;
  tax: String;
  items: IItems;
  userId: String;
  status: Boolean;
};

class IItems {
  itemId: String;
  selectedQuantity: Number;
  categoryId: String;
  subPrice: String;
  price: String;
};

export default IOrder
