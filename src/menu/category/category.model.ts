import * as mongoose from 'mongoose';
import ICategory from './category.interface';
 
const categorySchema = new mongoose.Schema({
  name: { type: String, required: false },
  status: { type: Boolean, default: true },
  description: { type: String, required: false },
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