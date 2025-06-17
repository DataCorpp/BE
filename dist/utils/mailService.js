"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.createTransporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email credentials - Use environment variables with fallbacks
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM;
// Tạo và export transporter để có thể kiểm tra kết nối
const createTransporter = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Creating email transporter...');
    try {
        // Create transporter with direct credentials instead of environment variables
        const transporter = nodemailer_1.default.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD,
            },
            // Disable debug logs to prevent showing credentials in terminal
            debug: false,
            logger: false,
            tls: {
                rejectUnauthorized: false // Bypass certificate verification (not recommended for production)
            }
        });
        console.log('✅ Email transporter created');
        return transporter;
    }
    catch (error) {
        console.error('❌ Failed to create email transporter');
        // In development mode, create a test account as fallback
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Creating test email account for development...');
            try {
                // Create a test account
                const testAccount = yield nodemailer_1.default.createTestAccount();
                console.log('✅ Test account created');
                // Create a transporter with the test account
                return nodemailer_1.default.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                    // Disable debug logs
                    debug: false,
                    logger: false
                });
            }
            catch (err) {
                console.error('❌ Failed to create test email account');
                // In development, return a fake transporter that doesn't actually send emails
                console.log('🔧 Creating fake transporter for development');
                return {
                    sendMail: (mailOptions) => {
                        console.log('📧 [DEV MODE] Email would be sent to:', mailOptions.to);
                        return Promise.resolve({
                            messageId: 'fake-message-id-' + Date.now(),
                            previewURL: `https://ethereal.email/message/preview-${Date.now()}`
                        });
                    },
                    verify: () => Promise.resolve(true),
                    options: { host: 'fake.dev.mail' },
                    close: () => Promise.resolve()
                };
            }
        }
        else {
            // For production, rethrow the error
            throw new Error(`Failed to create email transporter`);
        }
    }
});
exports.createTransporter = createTransporter;
/**
 * Send an email with a verification code to the specified email address
 * @param toEmail The recipient's email address
 * @param verificationCode The 6-digit verification code
 */
const sendVerificationEmail = (toEmail, verificationCode) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n=== EMAIL VERIFICATION PROCESS ===');
    console.log(`📧 Preparing to send verification email to: ${toEmail}`);
    try {
        // Create and verify transporter
        const transporter = yield (0, exports.createTransporter)();
        // Skip verification in development if using test account
        let isTestAccount = false;
        if (transporter.options &&
            typeof transporter.options === 'object' &&
            'host' in transporter.options &&
            (transporter.options.host === 'smtp.ethereal.email' ||
                transporter.options.host === 'fake.dev.mail' ||
                transporter.options.host === 'mock.mail')) {
            console.log(`✅ Using test account for development`);
            isTestAccount = true;
        }
        else {
            try {
                console.log('Verifying SMTP connection...');
                console.log('Email user:', EMAIL_USER ? 'Set' : 'Not set');
                console.log('Email password:', EMAIL_PASSWORD ? 'Set' : 'Not set');
                const isConnected = yield transporter.verify();
                if (!isConnected) {
                    throw new Error('Failed to connect to email service');
                }
                console.log('✅ SMTP Connection verified');
            }
            catch (verifyErr) {
                console.error('❌ SMTP Connection verification failed');
                console.error('Error details:', verifyErr);
                if (process.env.NODE_ENV !== 'development') {
                    throw verifyErr;
                }
                else {
                    console.log('⚠️ Continuing in development mode despite SMTP verification failure');
                }
            }
        }
        // Create HTML email template with verification code
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
            
            <div class="verification-code">
              ${verificationCode}
            </div>
            
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
        // Set up email options with proper sender
        const mailOptions = {
            from: EMAIL_FROM,
            to: toEmail,
            subject: 'Email Verification Code',
            text: `Your verification code is: ${verificationCode}. This code will expire in 1 minute.`,
            html: htmlTemplate
        };
        // Send with minimal logging
        const info = yield transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        // Only show message ID, not the full info object which might contain sensitive data
        if (info && info.messageId) {
            console.log('📝 Message ID: ' + info.messageId);
        }
        // If using ethereal test account, show preview URL without showing verification code
        if (isTestAccount) {
            // For our custom fake transporter that includes previewURL
            if (info && typeof info === 'object' && 'previewURL' in info) {
                console.log('🔍 Preview URL available for test account');
            }
            // For real nodemailer test accounts
            else if (typeof nodemailer_1.default.getTestMessageUrl === 'function') {
                try {
                    const previewURL = nodemailer_1.default.getTestMessageUrl(info);
                    if (previewURL) {
                        console.log('🔍 Preview URL available for test account');
                    }
                }
                catch (err) {
                    // Don't show error details
                    console.log('⚠️ Could not generate preview URL');
                }
            }
            console.log('⚠️ USING TEST ACCOUNT - Email not actually sent');
        }
        return;
    }
    catch (error) {
        console.error('❌ CRITICAL ERROR: Failed to send verification email');
        // In development, provide minimal error info without showing the verification code
        if (process.env.NODE_ENV === 'development') {
            console.log('🚨 DEVELOPMENT MODE: Email service failed but continuing registration flow');
            return;
        }
        // Rethrow with generic message
        throw new Error(`Failed to send verification email`);
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
/**
 * Send a password reset email with a reset link to the specified email address
 * @param toEmail The recipient's email address
 * @param resetToken The password reset token
 * @param resetLink The complete reset link including the token
 */
const sendPasswordResetEmail = (toEmail, resetToken, resetLink) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('\n=== PASSWORD RESET EMAIL PROCESS ===');
        console.log(`📧 Preparing to send password reset email to: ${toEmail}`);
        // Use the same transporter as for verification emails
        const transporter = yield (0, exports.createTransporter)();
        // Create HTML email template
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
            from: EMAIL_FROM,
            to: toEmail,
            subject: 'Password Reset Request',
            text: `We received a request to reset your password. Here is your password reset link: ${resetLink}. This link will expire in 10 minutes.`,
            html: htmlTemplate
        };
        // Send the email with minimal logging
        yield transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent successfully');
    }
    catch (error) {
        console.error('❌ Failed to send password reset email');
        // Rethrow with generic message to avoid showing sensitive information
        throw new Error('Failed to send password reset email');
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
