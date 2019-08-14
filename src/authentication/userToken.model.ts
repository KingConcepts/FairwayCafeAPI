import * as mongoose from 'mongoose';
import IUserToken from './userToken.interface';

const userTokenSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        token: { type: String, required: true },
        status: { type: String, required: true, enum: ['Active', 'Inactive'] },
        isAdmin: { type: Boolean, default: false }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

const UserToken = mongoose.model<IUserToken & mongoose.Document>('UserTokens', userTokenSchema);
export default UserToken;
// module.exports = mongoose.model('Users', userSchema);
