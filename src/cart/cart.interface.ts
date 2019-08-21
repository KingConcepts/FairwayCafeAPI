class ICart {
  totalQuantity: Number;
  totalTaxAmount: Number;
  total: Number;
  subTotal: Number;
  tax: Number;
  items: IItems;
  userId: String;
};

class IItems {
  itemId: String;
  selectedQuantity: Number;
  categoryId: String;
  subPrice: Number;
  price: Number;
};

export default ICart;