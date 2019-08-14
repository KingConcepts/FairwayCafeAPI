import * as mongoose from 'mongoose';
import * as autoIncrement from 'mongoose-auto-increment';

import IRestaurant from './restaurant.interface';

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: Boolean, default: true },
  description: { type: String, required: false },
  restroCode: { type: Number, required: true },
},
{
    strict: false,
    versionKey: false,
    timestamps: true,
});

autoIncrement.initialize(mongoose);

/** Auto increment for restroCode */
restaurantSchema.plugin(autoIncrement.plugin, {
  model: 'Restaurant',
  field: 'restroCode',
  startAt: 100,
  incrementBy: 1
});
const restaurantModel = mongoose.model<IRestaurant & mongoose.Document>('Restaurant', restaurantSchema);
 
export default restaurantModel;