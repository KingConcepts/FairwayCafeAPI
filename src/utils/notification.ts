import * as nodemailer from 'nodemailer';

export class Notification {

    public sendEmail() {
        return new Promise((resolve, reject) => {
            const smtpConfig = {
                service: 'Gmail',
                auth: {
                    user: 'rspl.test10@gmail.com',
                    pass: 'rspl123#'
                }
            };
            const transporter = nodemailer.createTransport(smtpConfig);

            const mailOptions = {
                to: 'anjali.pandya@rishabhsoft.com',
                from: '',
                subject: 'Test Mail',
                html: 'Hello!',
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });
    }

}
export default new Notification;

