import * as mongoose from 'mongoose';
import ITax from './tax.interface';

const taxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: {type:Boolean, default: true},
  description: { type: String, required: false },
  value: { type: String, required: true },
},
  {
    strict: false,
    versionKey: false,
    timestamps: true,
  });

const taxModel = mongoose.model<ITax & mongoose.Document>('Tax', taxSchema);

export default taxModel;