import * as mongoose from 'mongoose';
import * as autoIncrement from 'mongoose-auto-increment';

import IOrder from './order.interface';

var itemSchema = new mongoose.Schema({
  itemId: {
    ref: 'Item',
    type: mongoose.Schema.Types.ObjectId,
  },
  subPrice: { type: Number, required: true },
  selectedQuantity: { type: Number, required: true },
  categoryId: {
    ref: 'Category',
    type: mongoose.Schema.Types.ObjectId,
  }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, required: true },
  total: { type: Number, required: true },
  subTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  items: [itemSchema],
  userId: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  },
  totalQuantity: { type: Number, required: true },
  totalTaxAmount: { type: Number, required: true },
  status: { type: Number, default: true },
},
{
    strict: false,
    versionKey: false,
    timestamps: true,
});

autoIncrement.initialize(mongoose);

/** Auto increment for orderID */
orderSchema.plugin(autoIncrement.plugin, {
  model: 'Order',
  field: 'orderId',
  startAt: 100,
  incrementBy: 1
});

const orderModel = mongoose.model<IOrder & mongoose.Document>('Order', orderSchema);

export default orderModel;