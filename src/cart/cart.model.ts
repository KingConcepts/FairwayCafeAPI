import * as mongoose from 'mongoose';

import ICart from './cart.interface';

var itemSchema = new mongoose.Schema({
  itemId: {
    ref: 'Item',
    type: mongoose.Schema.Types.ObjectId,
  },
  selectedQuantity: { type: Number, required: true },
  subPrice: { type: String, required: true },
  price: { type: String, required: true },
  categoryId: {
    ref: 'Category',
    type: mongoose.Schema.Types.ObjectId,
  }
});

const cartSchema = new mongoose.Schema({
  totalTaxAmount: { type: String, required: true },
  totalQuantity: { type: Number, required: true },
  total: { type: String, required: true },
  subTotal: { type: String, required: true },
  tax: { type: String, required: true },
  items: [itemSchema],
  userId: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  }
},
{
    strict: false,
    versionKey: false,
    timestamps: true,
});

const cartModel = mongoose.model<ICart & mongoose.Document>('Cart', cartSchema);

export default cartModel;