class IOrder {
  orderId: Number;
  total: Number;
  subTotal: Number;
  tax: Number;
  items : IItems;
};

class IItems {
  itemId: String;
  price: Number;
  quantity: Number;
};

export default IOrder