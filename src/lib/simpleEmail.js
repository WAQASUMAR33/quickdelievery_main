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
      from: `"MARTZONA" <${senderEmail}>`,
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
                <td align="center" style="background: linear-gradient(135deg, #3B0764 0%, #1E1B4B 100%); padding: 36px 20px 30px;">
                  <div style="background: #ffffff; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; line-height: 56px; font-size: 28px; text-align: center;">
                    🔐
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">MARTZONA</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Password Reset Verification</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px 30px 24px;">
                  <p style="color: #2D3748; font-size: 16px; font-weight: 600; margin: 0 0 10px;">Hello,</p>
                  <p style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    We received a request to reset the password for your MARTZONA account. Use the 6-digit verification code below to complete the reset:
                  </p>

                  <!-- OTP Box -->
                  <div style="background-color: #faf5ff; border: 2px dashed #3B0764; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #3B0764; display: inline-block;">
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
                    &copy; ${new Date().getFullYear()} MARTZONA. All rights reserved.
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
      from: `"MARTZONA" <${senderEmail}>`,
      to: toEmail,
      subject: `Your MARTZONA Verification Code: ${otp}`,
      text: `Your MARTZONA password reset code is ${otp}. This code is valid for 5 minutes.`,
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
                <td align="center" style="background: linear-gradient(135deg, #3B0764 0%, #1E1B4B 50%, #0F172A 100%); padding: 36px 24px 30px;">
                  <div style="background: #FCB400; width: 52px; height: 52px; border-radius: 12px; display: inline-block; line-height: 52px; font-size: 26px; text-align: center; color: #1E1B4B; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(252,180,0,0.35);">
                    ✉️
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MARTZONA</h1>
                  <p style="color: #cbd5e1; margin: 6px 0 0; font-size: 14px; font-weight: 500;">Email Verification Required</p>
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
                  <p style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0 0 10px;">Welcome to MARTZONA,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Thank you for signing up! To complete your registration and unlock your profile creation, please verify your email address using the 6-digit confirmation code below:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #3B0764; border-radius: 12px; padding: 22px; text-align: center; margin: 0 0 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #3B0764; display: inline-block;">
                      ${otp}
                    </span>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">
                      ENTER THIS CODE IN YOUR REGISTRATION SCREEN
                    </p>
                  </div>

                  <!-- Expiration Note -->
                  <div style="background-color: #f0fdf4; border-left: 4px solid #3B0764; padding: 12px 16px; border-radius: 6px; margin: 0 0 20px;">
                    <p style="color: #3B0764; font-size: 13px; font-weight: 600; margin: 0;">
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
                    MARTZONA Marketplace & Logistics Fleet
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
      from: `"MARTZONA" <${senderEmail}>`,
      to: toEmail,
      subject: `Verify Your Email: ${otp} — MARTZONA`,
      text: `Your MARTZONA verification code is ${otp}. This code is valid for 10 minutes.`,
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

/**
 * Sends Driver Onboarding & Authorization Confirmation Email
 */
export const sendDriverAuthorizationEmail = async (toEmail, driverData = {}) => {
  try {
    const { transporter, senderEmail } = getMailTransporter()

    const name = driverData.name || 'Captain'
    const vehicleType = driverData.vehicleType || 'Motorcycle'
    const vehicleNumber = driverData.vehicleNumber || 'Registered'
    const city = driverData.city || 'Pakistan'

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Driver Account Authorized - MARTZONA</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0;">
              
              <!-- Header Gradient -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #43046C 0%, #24023A 50%, #0F172A 100%); padding: 36px 24px 30px;">
                  <div style="background: #FDB600; width: 56px; height: 56px; border-radius: 14px; display: inline-block; line-height: 56px; font-size: 28px; text-align: center; color: #24023A; margin-bottom: 12px; box-shadow: 0 4px 16px rgba(253,182,0,0.4);">
                    🚗
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">MARTZONA FLEET</h1>
                  <p style="color: #cbd5e1; margin: 6px 0 0; font-size: 14px; font-weight: 500;">Captain Onboarding & Authorization</p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 16px 28px; background-color: #ecfdf5; border-bottom: 1px solid #a7f3d0;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <span style="display: inline-block; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #059669;">
                          ✅ ACCOUNT AUTHORIZED & ACTIVE
                        </span>
                        <p style="margin: 2px 0 0; font-size: 13px; color: #065f46; font-weight: 600;">
                          Your Driver Profile is 100% verified and authorized for deliveries & RapidRide.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 32px 30px 24px;">
                  <p style="color: #0f172a; font-size: 17px; font-weight: 800; margin: 0 0 10px;">
                    Assalam-o-Alaikum, Captain ${name}!
                  </p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    Welcome to the <strong>MARTZONA Fleet Network</strong>. Your driver account and vehicle verification documents have been verified and authorized. You are now eligible to accept rides, courier requests, and deliveries.
                  </p>

                  <!-- Driver Details Table -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                      <tr>
                        <td style="color: #64748b; padding: 6px 0; font-weight: 600;">Captain Name:</td>
                        <td style="color: #0f172a; padding: 6px 0; font-weight: 800; text-align: right;">${name}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 6px 0; font-weight: 600;">Registered Email:</td>
                        <td style="color: #0f172a; padding: 6px 0; font-weight: 800; text-align: right;">${toEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 6px 0; font-weight: 600;">Vehicle Class:</td>
                        <td style="color: #0f172a; padding: 6px 0; font-weight: 800; text-align: right;">${vehicleType}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 6px 0; font-weight: 600;">Vehicle Plate:</td>
                        <td style="color: #0f172a; padding: 6px 0; font-weight: 800; text-align: right;">${vehicleNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 6px 0; font-weight: 600;">Operating City:</td>
                        <td style="color: #0f172a; padding: 6px 0; font-weight: 800; text-align: right;">${city}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 6px 0; font-weight: 600;">Verification Status:</td>
                        <td style="color: #059669; padding: 6px 0; font-weight: 800; text-align: right;">Verified & Authorized</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Quick Start Steps -->
                  <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 18px; margin: 0 0 24px;">
                    <h4 style="color: #43046C; font-size: 14px; font-weight: 800; margin: 0 0 10px;">
                      🚀 Next Steps to Start Earning:
                    </h4>
                    <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 13px; line-height: 1.6;">
                      <li>Open the <strong>MartZona Driver App</strong>.</li>
                      <li>Sign in with your email (<code>${toEmail}</code>) and your password.</li>
                      <li>Switch your Duty toggle to <strong>ON DUTY</strong> to receive instant trip offers and RapidRide orders.</li>
                    </ol>
                  </div>

                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you have questions or need support, contact our 24/7 Captain Support team at support@martzona.com.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #fafbfc; border-top: 1px solid #eef0f3; padding: 20px 30px; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; font-weight: 600; margin: 0 0 4px;">
                    MARTZONA Marketplace & Logistics Fleet
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
      from: `"MARTZONA Fleet" <${senderEmail}>`,
      to: toEmail,
      subject: `Captain Profile Verified & Authorized — Welcome to MARTZONA Fleet`,
      text: `Assalam-o-Alaikum, Captain ${name}! Your driver profile is verified and authorized on MartZona Fleet. Vehicle: ${vehicleType} (${vehicleNumber}), City: ${city}. Sign in to the Driver App and switch ON DUTY to start earning.`,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Driver authorization email sent successfully to:', toEmail, 'Message ID:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending driver authorization email:', error)
    return { success: false, error: error.message }
  }
}
