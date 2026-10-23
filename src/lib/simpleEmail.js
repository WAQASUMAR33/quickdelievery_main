import nodemailer from 'nodemailer'

function getMailTransporter() {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '465', 10)
  const user = process.env.MAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USERNAME
  const rawPass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || ''
  const pass = rawPass.replace(/\s+/g, '')

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please set MAIL_USER and MAIL_PASSWORD in your .env file.')
  }

  const isGmail = host.toLowerCase().includes('gmail')

  const transportOptions = isGmail
    ? {
        service: 'gmail',
        auth: { user, pass },
      }
    : {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }

  return {
    transporter: nodemailer.createTransport(transportOptions),
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

/**
 * Send 6-digit OTP verification email for account registration
 */
export const sendVerificationOtpEmail = async (toEmail, otp, role = 'CUSTOMER') => {
  try {
    const { transporter, senderEmail } = getMailTransporter()

    const roleLabels = {
      CUSTOMER: {
        title: 'Customer Account',
        subtitle: 'Boutique Food, Fresh Groceries & Tech Ordering',
        badgeColor: '#2563EB',
        bgColor: '#EFF6FF',
      },
      VENDOR: {
        title: 'Merchant & Kitchen Partner',
        subtitle: 'Digital Storefront & Order Management Onboarding',
        badgeColor: '#D97706',
        bgColor: '#FFFBEB',
      },
      DRIVER: {
        title: 'Express Delivery Partner',
        subtitle: 'Fleet Logistics & Courier Onboarding',
        badgeColor: '#059669',
        bgColor: '#ECFDF5',
      },
    }

    const currentRole = roleLabels[role?.toUpperCase()] || roleLabels.CUSTOMER

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0;">
              
              <!-- Header Gradient -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 36px 24px 30px;">
                  <div style="background: #39772A; width: 52px; height: 52px; border-radius: 12px; display: inline-block; line-height: 52px; font-size: 26px; text-align: center; color: #ffffff; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(57,119,42,0.35);">
                    ✉️
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Quick Delivery</h1>
                  <p style="color: #94a3b8; margin: 6px 0 0; font-size: 14px; font-weight: 500;">Email Verification Required</p>
                </td>
              </tr>

              <!-- Role Ribbon -->
              <tr>
                <td style="padding: 14px 28px; background-color: ${currentRole.bgColor}; border-bottom: 1px solid #e2e8f0;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: ${currentRole.badgeColor};">
                          ${currentRole.title}
                        </span>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${currentRole.subtitle}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 32px 30px 24px;">
                  <p style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0 0 10px;">Welcome to Quick Delivery,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Thank you for signing up! To complete your registration and unlock your profile creation, please verify your email address using the 6-digit confirmation code below:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #39772A; border-radius: 12px; padding: 22px; text-align: center; margin: 0 0 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #39772A; display: inline-block;">
                      ${otp}
                    </span>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">
                      ENTER THIS CODE IN YOUR REGISTRATION SCREEN
                    </p>
                  </div>

                  <!-- Expiration Note -->
                  <div style="background-color: #f0fdf4; border-left: 4px solid #39772A; padding: 12px 16px; border-radius: 6px; margin: 0 0 20px;">
                    <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0;">
                      ⏱️ This code expires in <strong>10 minutes</strong>.
                    </p>
                  </div>

                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you did not request this registration, you can safely ignore this email. Someone may have entered your email by mistake.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #fafbfc; border-top: 1px solid #eef0f3; padding: 20px 30px; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; font-weight: 600; margin: 0 0 4px;">
                    Quick Delivery Marketplace & Logistics Fleet
                  </p>
                  <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                    Automated transactional message sent via Hostinger Secure Mail.
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
      subject: `Verify Your Email: ${otp} — Quick Delivery`,
      text: `Your Quick Delivery verification code is ${otp}. This code is valid for 10 minutes.`,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Verification OTP email sent successfully to:', toEmail, 'Message ID:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending verification OTP email:', error)
    return { success: false, error: error.message }
  }
}

