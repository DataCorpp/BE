# Email Service Setup Guide

This guide will help you set up the email service for sending verification codes.

## Gmail App Password Setup

To use Gmail for sending emails in the application, you need to set up an App Password:

1. **Enable 2-Step Verification**:
   - Go to your Google Account at [https://myaccount.google.com/](https://myaccount.google.com/)
   - Click on "Security" in the left sidebar
   - Under "Signing in to Google", select "2-Step Verification" and turn it on

2. **Create an App Password**:
   - After enabling 2-Step Verification, go back to the Security page
   - Click on "App passwords" (under "Signing in to Google") - Link: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app and "Other" as the device
   - Enter a name for the app (e.g., "Datacom Web App")
   - Click "Generate"
   - Google will generate a 16-character password - copy this password

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root of the website-BE directory (if it doesn't exist already)
   - Add the following variables:
     ```
     EMAIL_USER=your_gmail_address@gmail.com
     EMAIL_PASSWORD=your_16_character_app_password

     EMAIL_FROM="Datacom Web <your_gmail_address@gmail.com>"
     ```

## Testing the Email Service

To test if your email service is working correctly:

1. Update the `.env` file with your credentials
2. Restart the server
3. Register a new user through the application
4. Check if the verification email is sent successfully

## Troubleshooting

If you encounter issues with sending emails:

1. **Check Console Logs**: Look for any error messages in the server console
2. **Verify Credentials**: Make sure your EMAIL_USER and EMAIL_PASSWORD are correct
3. **Check Gmail Settings**: Ensure that "Less secure app access" is turned on if you're not using an App Password
4. **Firewall Issues**: If you're behind a corporate firewall, it might block outgoing SMTP connections

## Production Considerations

For production environments:

1. Consider using a transactional email service like SendGrid, Mailgun, or Amazon SES
2. Update the mail transport configuration in `mailService.ts` accordingly
3. Never commit email credentials to version control
4. Use environment variables for all sensitive information 