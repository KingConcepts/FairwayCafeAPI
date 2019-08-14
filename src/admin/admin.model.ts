import * as mongoose from 'mongoose';
import IAdmin from './admin.interface';

const adminSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true},
        lastName: { type: String, required: true},
        username: { type: String, required: true},
        email: { type: String, required: true},
        password: { type: String, required: true},
        status: { type: String, required: true},
    },
    {
        strict: false,
        versionKey: false,
        timestamps: true,
    }
);

const Admin = mongoose.model<IAdmin & mongoose.Document>('Admin', adminSchema);

export default Admin;
