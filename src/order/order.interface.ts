class IOrder {
  orderId: Number;
  totalQuantity: Number;
  totalTaxAmount: Number;
  total: Number;
  subTotal: Number;
  tax: Number;
  items: IItems;
  userId: String;
  status: Boolean;
};

class IItems {
  itemId: String;
  selectedQuantity: Number;
  categoryId: String;
  subPrice: Number;
  price: Number;
};

export default IOrder
