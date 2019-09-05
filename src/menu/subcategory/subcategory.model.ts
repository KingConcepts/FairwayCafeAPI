import * as mongoose from 'mongoose';
import ISubcategory from './subcategory.interface';
 
const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: false },
  status: { type: Boolean, default: true },
  description: { type: String, required: false, default: '' },
  imageURL: { type: String, default: '' },
  categoryId : { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
},
{
    strict: false,
    versionKey: false,
    timestamps: true,
});

const subcategoryModel = mongoose.model<ISubcategory & mongoose.Document>('Subcategory', subcategorySchema);
 
export default subcategoryModel;