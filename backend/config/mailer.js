// config/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar correos
function sendEmail(to, subject, text, from = null) {
  const mailOptions = {
    from: from || process.env.MAIL_USER,
    to,
    subject,
    text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("❌ Error al enviar el correo:", error);
    } else {
      console.log("📧 Correo enviado: " + info.response);
    }
  });
}

module.exports = { transporter, sendEmail };
