import * as mongoose from 'mongoose';
import UserToken from './userToken.interface';

const userTokenSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        token: { type: String, required: true },
    },
    {
        strict: false,
        versionKey: false,
        timestamps: true,
    }
);

const UserToken = mongoose.model<UserToken & mongoose.Document>('UserTokens', userTokenSchema);
export default UserToken;
// module.exports = mongoose.model('Users', userSchema);
