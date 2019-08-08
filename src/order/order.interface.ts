class IOrder {
  orderId: Number;
  total: Number;
  subTotal: Number;
  tax: Number;
  items : IItems;
  userId: String
};

class IItems {
  itemId: String;
  price: Number;
  quantity: Number;
};

export default IOrder