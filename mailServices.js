const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jobduniya.inc@gmail.com',
        pass: 'jkxj quzq ghis gico'
    }
});

const SendMailToApplicient = async (to, subject, html) => {
    console.log(to , subject , html);
    try {
        const MailOption = {
            from:"jobduniya.inc@gmail.com",
            to,
            subject,
            html
        };
        const info = await transporter.sendMail(MailOption);
        console.log('Email sent: ' + info.response);
        return { success: true, message: 'Email sent successfully' };
    } catch(error) {
        console.error(error);
        return { success: false, message: 'Error sending email' };
    }
}

module.exports={SendMailToApplicient}