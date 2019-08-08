import * as mongoose from 'mongoose';
import * as autoIncrement from 'mongoose-auto-increment';

import IOrder from './order.interface';

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, required: true },
  total: { type: Number, required: true },
  subTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  items: { type: Array, required: true },
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