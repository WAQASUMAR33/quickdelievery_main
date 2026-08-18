import nodemailer from 'nodemailer'

function getMailTransporter() {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10)
  const user = process.env.MAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USERNAME
  const rawPass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || ''
  const pass = rawPass.replace(/\s+/g, '')

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please set MAIL_USER and MAIL_PASSWORD in your .env file.')
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    senderEmail: user,
  }
}

export const sendTestEmail = async (toEmail, subject, text) => {
  try {
    const { transporter, senderEmail } = getMailTransporter()
    const mailOptions = {
      from: `"Quick Delivery" <${senderEmail}>`,
      to: toEmail,
      subject: subject,
      text: text,
      html: `<p>${text}</p>`,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const { transporter, senderEmail } = getMailTransporter()

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f8; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #eef0f3;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #39772A 0%, #2f6323 100%); padding: 36px 20px 30px;">
                  <div style="background: #ffffff; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; line-height: 56px; font-size: 28px; text-align: center;">
                    🔐
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Quick Delivery</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Password Reset Verification</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px 30px 24px;">
                  <p style="color: #2D3748; font-size: 16px; font-weight: 600; margin: 0 0 10px;">Hello,</p>
                  <p style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    We received a request to reset the password for your Quick Delivery account. Use the 6-digit verification code below to complete the reset:
                  </p>

                  <!-- OTP Box -->
                  <div style="background-color: #f0fdf4; border: 2px dashed #39772A; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #39772A; display: inline-block;">
                      ${otp}
                    </span>
                  </div>

                  <!-- Warning Alert -->
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 0 0 24px;">
                    <p style="color: #92400e; font-size: 13px; font-weight: 600; margin: 0;">
                      ⏱️ This code is valid for exactly <strong>5 minutes</strong>.
                    </p>
                  </div>

                  <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0 0 10px;">
                    If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized access.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #fafbfc; border-top: 1px solid #eef0f3; padding: 20px 30px; text-align: center;">
                  <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Quick Delivery. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `

    const mailOptions = {
      from: `"Quick Delivery" <${senderEmail}>`,
      to: toEmail,
      subject: `Your Quick Delivery Verification Code: ${otp}`,
      text: `Your Quick Delivery password reset code is ${otp}. This code is valid for 5 minutes.`,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('OTP Email sent successfully to:', toEmail, 'Message ID:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return { success: false, error: error.message }
  }
}
