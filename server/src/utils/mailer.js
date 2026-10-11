import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, text, html, attachments }) => {


  if (!process.env.NODEMAILER_USER || !process.env.NODEMAILER_PASS) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`)
    return
  }

  // ✅ transporter created only when credentials exist
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  })

  try {
    await transporter.sendMail({
      from:    `"NEEVEVERA PVT LTD" <${process.env.NODEMAILER_USER}>`,
      to,
      subject,
      text,
      html,
      attachments
    })
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`)
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message)
  }
}

export default sendEmail;