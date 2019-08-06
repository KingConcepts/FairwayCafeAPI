import * as mongoose from 'mongoose';
import ISubcategory from './subcategory.interface';
 
const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: false },
  status: { type: Boolean, required: false },
  description: { type: String, required: false },
  imageURL: { type: String, required: false },
  categoryId : { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
});

const subcategoryModel = mongoose.model<ISubcategory & mongoose.Document>('Subcategory', subcategorySchema);
 
export default subcategoryModel;