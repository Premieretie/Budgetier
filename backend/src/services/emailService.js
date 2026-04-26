const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address
// For Resend testing, use 'onboarding@resend.dev' or verify your own domain
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send bank connect link email to user
 */
async function sendBankConnectEmail({ to, name, connectLink }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: 'Connect Your Bank Account - Budgetier',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Connect Your Bank Account</h2>
          
          <p>Hi ${name || 'there'},</p>
          
          <p>Thank you for choosing Budgetier! To start tracking your finances automatically, please connect your bank account by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${connectLink}" 
               style="background: #7c3aed; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;
                      font-weight: bold;">
              Connect Bank Account
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:
            <br>
            <a href="${connectLink}" style="color: #7c3aed; word-break: break-all;">
              ${connectLink}
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 12px;">
            This link will expire in 1 hour for security reasons.<br>
            If you didn't request this, please ignore this email.<br>
            <br>
            Budgetier - Your Personal Finance Manager
          </p>
        </div>
      `,
      text: `Connect Your Bank Account - Budgetier

Hi ${name || 'there'},

Thank you for choosing Budgetier! To start tracking your finances automatically, please connect your bank account by visiting:

${connectLink}

This link will expire in 1 hour for security reasons.

If you didn't request this, please ignore this email.

Budgetier - Your Personal Finance Manager
`,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent successfully to:', to);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Email service error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send welcome email after successful bank connection
 */
async function sendBankConnectedEmail({ to, name, institutionName, accountName }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: 'Bank Account Connected Successfully - Budgetier',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">🎉 Bank Account Connected!</h2>
          
          <p>Hi ${name || 'there'},</p>
          
          <p>Great news! Your bank account has been successfully connected to Budgetier.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Connection Details:</h3>
            <p style="margin: 5px 0;"><strong>Bank:</strong> ${institutionName || 'Connected Bank'}</p>
            <p style="margin: 5px 0;"><strong>Account:</strong> ${accountName || 'Your Account'}</p>
          </div>
          
          <p>Your transactions will now be automatically synced every 6 hours. You can view them in your Budgetier dashboard.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 12px;">
            Budgetier - Your Personal Finance Manager
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Failed to send confirmation email:', error);
      return { success: false, error };
    }

    console.log('✅ Confirmation email sent to:', to);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Email service error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendBankConnectEmail,
  sendBankConnectedEmail,
};
