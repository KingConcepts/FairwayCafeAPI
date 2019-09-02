import * as nodemailer from 'nodemailer';

export class Notification {

    public sendEmail() {
        return new Promise((resolve, reject) => {
            const smtpConfig = {
                // service: 'Gmail',
                host: 'smtp.gmail.com',
                // port: 587,
                // tls: {
                //     ciphers: 'SSLv3'
                // },
                // secure: false,
                auth: {
                    user: 'rspl.fe@gmail.com',
                    pass: 'rspl123#'
                }
            };
            const transporter = nodemailer.createTransport(smtpConfig);

            const mailOptions = {
                to: 'anjali.pandya@rishabhsoft.com',
                from: 'rspl.fe@gmail.com',
                subject: 'Test Mail',
                text: 'Hello!',
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('error',error);
                    // reject(error);
                } else {
                    console.log('info',info);
                    // resolve(info);
                }
            });
        });
    }

}
export default new Notification;

