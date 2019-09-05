import * as mongoose from 'mongoose';
import ICategory from './category.interface';

const categorySchema = new mongoose.Schema({
  name: { type: mongoose.Schema.Types.String, required: true},
  status: { type: Boolean, default: true },
  description: { type: String, required: false, default: '' },
  imageURL: { type: String, default: '' },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }
},
  {
    strict: false,
    versionKey: false,
    timestamps: true,
  });

const categoryModel = mongoose.model<ICategory & mongoose.Document>('Category', categorySchema);

export default categoryModel;