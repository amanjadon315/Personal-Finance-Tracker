const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const getEmailTemplate = (otp, type) => {
  const templates = {
    verify: {
      subject: 'Verify Your Finance Tracker Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #059669; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">🔐</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px;">Finance Tracker</h1>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Login Verification</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Someone is trying to sign in to your Finance Tracker account. If this was you, please use the verification code below:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your login code is:</p>
              <h1 style="color: #059669; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              • This code will expire in 10 minutes<br>
              • Don't share this code with anyone<br>
              • If you didn't try to sign in, please change your password immediately
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                This email was sent by Finance Tracker. If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    },
    
    resend: {
      subject: 'New Finance Tracker Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #7C3AED; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">📨</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px;">Finance Tracker</h1>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">New Verification Code</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              You requested a new verification code for your Finance Tracker account. Here's your new code:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your new verification code is:</p>
              <h1 style="color: #7C3AED; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              • This code will expire in 10 minutes<br>
              • Your previous codes are no longer valid<br>
              • Don't share this code with anyone
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                This email was sent by Finance Tracker. If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    }
  };

  return templates[type] || templates.verify;
};

// Send OTP via email
const sendOTP = async (email, otp, type = 'verify') => {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate(otp, type);

    const mailOptions = {
      from: {
        name: 'Finance Tracker',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`OTP email sent successfully to ${email} for ${type}`);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// Send OTP via SMS (using Twilio)
const sendOTPviaSMS = async (phone, otp, type = 'verify') => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const messages = {
      verify: `Your Finance Tracker verification code is: ${otp}. This code will expire in 10 minutes. Don't share this code with anyone.`,
      login: `Your Finance Tracker login code is: ${otp}. This code will expire in 10 minutes. If you didn't try to login, please contact support.`,
      resend: `Your new Finance Tracker verification code is: ${otp}. This code will expire in 10 minutes.`
    };

    const message = await twilio.messages.create({
      body: messages[type] || messages.verify,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`OTP SMS sent successfully to ${phone} for ${type}`);
    return {
      success: true,
      messageId: message.sid
    };

  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    throw new Error(`Failed to send OTP SMS: ${error.message}`);
  }
};

module.exports = {
  sendOTP,
  sendOTPviaSMS
};
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #4F46E5; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">💰</span>
              </div>
              <h1 style="color: #333; margin: 0; font-size: 28px;">Finance Tracker</h1>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Verify Your Account</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Welcome to Finance Tracker! To complete your registration and start managing your finances, please verify your account using the OTP below:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your verification code is:</p>
              <h1 style="color: #4F46E5; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              • This code will expire in 10 minutes<br>
              • Don't share this code with anyone<br>
              • If you didn't create an account, please ignore this email
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                This email was sent by Finance Tracker. If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    },
    
    login: {
      subject: 'Your Finance Tracker Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            