import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const user = process.env.NODEMAILER_USER || process.env.SMTP_USER;
  const pass = process.env.NODEMAILER_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.log(`[EMAIL SKIPPED] Email credentials not set in .env | To: ${to} | Subject: ${subject}`);
    return;
  }

  // Support both custom SMTP (host/port) and standard provider service (e.g. gmail)
  const transportConfig = process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      }
    : {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user, pass },
      };

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"NEEVEVERA PVT LTD" <${user}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
};

export default sendEmail;
