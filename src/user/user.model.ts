import * as mongoose from 'mongoose';
import IUser from './user.interface';

const userSchema = new mongoose.Schema(
    {
        filler: { type: String, required: false },
        empNumber: { type: String, required: true },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        middleName: { type: String, required: false },
        preferredName: { type: String, required: false },
        busPhone: { type: String, required: false },
        companyCode: { type: String, required: false },
        costCtr: { type: String, required: false },
        costCtrDesc: { type: String, required: false },
        filler2: { type: String, required: false },
        status: { type: String, required: false },
        empType: { type: String, required: false },
        filler3: { type: String, required: false },
        shift: { type: String, required: false },
        email: { type: String, required: true },
        email2: { type: String, required: false },
        supervisorFirstName: { type: String, required: false },
        supervisorLastName: { type: String, required: false },
        supervisorEmail: { type: String, required: false },
        supervisorPhone: { type: String, required: false },
        employeeMailStop: { type: String, required: false },
        dateOfOriginalHire: { type: String, required: false },
        dateOfLastHire: { type: String, required: false },
        filler4: { type: String, required: false },
        dateOfLastPrefRev: { type: String, required: false },
        dateOfNextPrefRev: { type: String, required: false },
        jobCode: { type: String, required: false },
        jobDescription: { type: String, required: false },
        filler5: { type: String, required: false },
        busPartnerName: { type: String, required: false },
        filler6: { type: String, required: false },
        busPartnerEmail: { type: String, required: false },
        supervisorEmpNumber: { type: String, required: false },
        companyCode2: { type: String, required: true },
        functionDescription: { type: String, required: false },
        location: { type: String, required: false },
        orgChartElig: { type: String, required: false },
        isRegistered: { type: Boolean, default: false },
        password: { type: String, required: false },
        username: { type: String, required: false }
    },
    {
        strict: false,
        versionKey: false,
        timestamps: true,
    }
);

const User = mongoose.model<IUser & mongoose.Document>('User', userSchema);


export default User;
// module.exports = mongoose.model('Users', userSchema);

