import * as mongoose from 'mongoose';
import IItem from './item.interface';


const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: Boolean, default: true },
  description: { type: String, required: false },
  imageURL: { type: String, default: '' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subategory', required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
},
{
    strict: false,
    versionKey: false,
    timestamps: true,
});

const itemModel = mongoose.model<IItem & mongoose.Document>('Item', itemSchema);

export default itemModel;