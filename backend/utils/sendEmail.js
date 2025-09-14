// utils/sendEmail.js
// This is a placeholder. A real implementation would use a service like SendGrid, Mailgun, or Nodemailer.
const sendEmail = async (options) => {
    console.log('--- Sending Email ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log('---------------------');
    // In a real app, this would be:
    // await transporter.sendMail(...)
    return Promise.resolve();
};

module.exports = sendEmail;