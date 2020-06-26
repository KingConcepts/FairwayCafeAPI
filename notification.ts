import * as nodemailer from 'nodemailer';
import * as _ from 'lodash';

export class Notification {

    sendEmailNotifications = (template, templateData = {}) => {
        const finalTemp = this.getHtmlTemplate(template, templateData);
        this.sendEmail(finalTemp, templateData);
    };

    getHtmlTemplate = (template, templateData) => {
        try {
            const compiled = _.template(template);
            return compiled(templateData);
        } catch (error) {
            console.error(error);
        }
    };

    public sendEmail(template, templateData) {
        return new Promise((resolve, reject) => {
            const smtpConfig = {
		host: 'smtp.callawaygolf.com',
                port: 25,
		tls: {
        		rejectUnauthorized: false
    		},
                auth: {
                    user: process.env.EMAIL_USER_ID,
                    pass: process.env.EMAIL_PASSWORD
                }
            };
            const transporter = nodemailer.createTransport(smtpConfig);
            const mailOptions = {
                to: templateData.to,
                from: process.env.EMAIL_USER_ID,
                subject: templateData.subject,
                html: template,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('error', error);
                    reject(error);
                } else {
                    console.log('info', info);
                    resolve(info);
                }
            });
        });
    }

}
export default new Notification;
