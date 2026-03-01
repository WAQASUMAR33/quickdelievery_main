import nodemailer from 'nodemailer'

export const sendTestEmail = async (toEmail, subject, text) => {
  try {
    console.log('Sending test email to:', toEmail)
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { 
        success: false, 
        error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env.local file' 
      }
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const mailOptions = {
      from: `"Quick Delivery" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: subject,
      text: text,
      html: `<p>${text}</p>`
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Test email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending test email:', error)
    return { success: false, error: error.message }
  }
}
