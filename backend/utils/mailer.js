const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'joyeuxpierreishime@gmail.com',
    pass: 'vumi qxsu ktht zoxj'
  }
});

exports.sendMail = (to, subject, text) => {
  const mailOptions = {
    from: 'your_email@gmail.com',
    to,
    subject,
    text
  };
  return transporter.sendMail(mailOptions);
};
