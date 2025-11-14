import nodemailer from "nodemailer";

const getOtpEmailTemplate = (otp) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ArenaX - Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(180deg, #0B0B0F 0%, #14141E 50%, #1A1A2E 100%); min-height: 100vh;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #0B0B0F 0%, #14141E 50%, #1A1A2E 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(180deg, rgba(11, 11, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 229, 255, 0.15); border: 1px solid rgba(0, 229, 255, 0.2);">
                    <!-- Top Gradient Bar -->
                    <tr>
                        <td style="height: 4px; background: linear-gradient(90deg, #00E5FF 0%, #8A2BE2 50%, #00E5FF 100%); box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);"></td>
                    </tr>
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 48px; font-weight: 900; color: #FFFFFF; letter-spacing: -1px;">
                                ArenaX
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #9CA3AF; font-size: 14px; font-weight: 500;">
                                Gaming Platform
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 16px 0; color: #E5E7EB; font-size: 24px; font-weight: 700;">
                                Password Reset Request
                            </h2>
                            <p style="margin: 0 0 24px 0; color: #9CA3AF; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password. Use the OTP code below to complete the process:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- OTP Box -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;" align="center">
                            <table cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%); border: 2px solid rgba(0, 229, 255, 0.3); border-radius: 16px; padding: 30px 40px; box-shadow: 0 0 40px rgba(0, 229, 255, 0.2), inset 0 0 20px rgba(0, 229, 255, 0.05);">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 12px 0; color: #00E5FF; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                                            Your OTP Code
                                        </p>
                                        <p style="margin: 0; font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #FFFFFF;">
                                            ${otp}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Warning -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px 20px; width: 100%;">
                                <tr>
                                    <td>
                                        <p style="margin: 0; color: #FCA5A5; font-size: 14px; line-height: 1.5;">
                                            ⚠️ <strong>Important:</strong> This OTP will expire in <strong>5 minutes</strong>. If you didn't request this, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                                For security reasons, never share this OTP with anyone. ArenaX staff will never ask for your OTP code.
                            </p>
                            <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                                If you have any questions, feel free to contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, 0.3) 50%, transparent 100%);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px;">
                                © 2025 ArenaX. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #4B5563; font-size: 12px;">
                                Powered by cutting-edge gaming technology
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Bottom Spacing -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; padding: 0 20px;">
                            <p style="margin: 0; color: #4B5563; font-size: 12px; line-height: 1.5;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"ArenaX Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
    };

    if (html) {
      mailOptions.html = html;
      mailOptions.text = text; 
    } else {
      mailOptions.text = text;
    }

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error; 
  }
};

export const sendOtpEmail = async (to, otp) => {
  const subject = "🎮 ArenaX Support - Password Reset OTP";
  const plainText = `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you didn't request this, please ignore this email.`;
  const htmlContent = getOtpEmailTemplate(otp);
  
  await sendEmail(to, subject, plainText, htmlContent);
};