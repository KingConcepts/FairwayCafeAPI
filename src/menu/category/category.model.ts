import * as mongoose from 'mongoose';
import ICategory from './category.interface';
 
const categorySchema = new mongoose.Schema({
  name: { type: String, required: false },
  status: { type: Boolean, required: false },
  description: { type: String, required: false },
  imageURL: { type: String, default: '' },
});
 
const categoryModel = mongoose.model<ICategory & mongoose.Document>('Category', categorySchema);
 
export default categoryModel;