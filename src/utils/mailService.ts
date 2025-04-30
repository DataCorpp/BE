import nodemailer from 'nodemailer';

/**
 * Send an email with a verification code to the specified email address
 * @param toEmail The recipient's email address
 * @param verificationCode The 6-digit verification code
 */
export const sendVerificationEmail = async (toEmail: string, verificationCode: string): Promise<void> => {
  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'yourgmail@gmail.com', // Use environment variable or default
      pass: process.env.EMAIL_PASSWORD || 'app password'  // Use environment variable or default
    }
  });

  // Create a more professional HTML email template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eeeeee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 20px 0;
        }
        .verification-code {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          color: #4f46e5;
          letter-spacing: 4px;
          padding: 16px;
          margin: 20px 0;
          background-color: #f5f5ff;
          border-radius: 8px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #999;
          padding: 20px 0;
          border-top: 1px solid #eeeeee;
        }
        .note {
          font-size: 14px;
          color: #666;
          padding: 10px;
          background-color: #fffde7;
          border-radius: 4px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for registering with our platform. To complete your registration, please use the verification code below:</p>
          
          <div class="verification-code">${verificationCode}</div>
          
          <p>This code will expire in <strong>1 minute</strong>.</p>
          
          <div class="note">
            <strong>Note:</strong> If you did not request this verification code, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Set up email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"DataCorp Solutions" <yourgmail@gmail.com>',
    to: toEmail,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${verificationCode}. This code will expire in 1 minute.`,
    html: htmlTemplate
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a password reset email with a reset link to the specified email address
 * @param toEmail The recipient's email address
 * @param resetToken The password reset token
 * @param resetLink The complete reset link including the token
 */
export const sendPasswordResetEmail = async (toEmail: string, resetToken: string, resetLink: string): Promise<void> => {
  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'yourgmail@gmail.com', // Use environment variable or default
      pass: process.env.EMAIL_PASSWORD || 'app password'  // Use environment variable or default
    }
  });

  // Create a more professional HTML email template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eeeeee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #4338ca;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #999;
          padding: 20px 0;
          border-top: 1px solid #eeeeee;
        }
        .note {
          font-size: 14px;
          color: #666;
          padding: 10px;
          background-color: #fffde7;
          border-radius: 4px;
          margin-top: 20px;
        }
        .expiry {
          font-size: 14px;
          color: #e11d48;
          margin-top: 10px;
        }
        .manual-link {
          word-break: break-all;
          color: #4f46e5;
          font-size: 13px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your account. Please click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Your Password</a>
          </div>
          
          <p class="expiry">This link will expire in <strong>10 minutes</strong>.</p>
          
          <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
          <div class="manual-link">${resetLink}</div>
          
          <div class="note">
            <strong>Note:</strong> If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Set up email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"CPG Matching website" <yourgmail@gmail.com>',
    to: toEmail,
    subject: 'Password Reset Request',
    text: `We received a request to reset your password. Here is your password reset link: ${resetLink}. This link will expire in 10 minutes.`,
    html: htmlTemplate
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}; 