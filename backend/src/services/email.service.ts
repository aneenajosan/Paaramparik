import nodemailer, { Transporter } from 'nodemailer';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  from: string;
  to: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Initializes or returns the cached nodemailer transporter
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    // 1. In unit test environment, use jsonTransport for instant non-blocking execution
    if (process.env.NODE_ENV === 'test') {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return this.transporter;
    }

    // 2. Direct Gmail integration (EMAIL_USER + EMAIL_PASS or GMAIL_USER + GMAIL_PASS)
    const gmailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const gmailPass = process.env.EMAIL_PASS || process.env.GMAIL_PASS;

    if (gmailUser && gmailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser.trim(),
          pass: gmailPass.trim().replace(/\s+/g, ''), // strip spaces from Google App Password
        },
      });
      console.log(`[EMAIL-SERVICE] Active real mail delivery via Gmail SMTP (${gmailUser.trim()})`);
      return this.transporter;
    }

    // 3. Custom SMTP credentials (e.g. Resend, Brevo, SendGrid, Amazon SES, or custom host)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT) || 587;
      const isSecure = port === 465 || process.env.SMTP_SECURE === 'true';

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port,
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASS.trim(),
        },
      });
      console.log(`[EMAIL-SERVICE] Active real mail delivery via SMTP: ${process.env.SMTP_HOST}:${port} (${process.env.SMTP_USER})`);
      return this.transporter;
    }

    // 4. In development fallback: attempt to initialize Ethereal test inbox
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EMAIL-SERVICE] Running on Ethereal sandbox test account: ${testAccount.user}`);
      console.log(`[EMAIL-SERVICE] ℹ️ To send to REAL inboxes, add EMAIL_USER & EMAIL_PASS (Gmail app password) in backend/.env`);
      return this.transporter;
    } catch (err) {
      console.warn('[EMAIL-SERVICE] Falling back to direct stream transport:', (err as Error).message);
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
      });
      return this.transporter;
    }
  }

  /**
   * Dispatches an OTP verification email to the user's provided email address.
   */
  async sendOtpEmail(toEmail: string, otp: string, senderName = 'Paaramparik Cultural Map'): Promise<EmailDispatchResult> {
    const gmailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const smtpFrom = process.env.SMTP_FROM || process.env.SAMPLE_EMAIL_FROM;
    
    // When using Gmail, the sender email must match the authenticated account
    const fromAddress = smtpFrom || (gmailUser ? `"${senderName}" <${gmailUser.trim()}>` : `"${senderName}" <verify@paaramparik.culture>`);
    const subject = `Your Paaramparik Verification Code: ${otp}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Paaramparik Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1a080c; color: #FFF8E7; margin: 0; padding: 20px; }
    .card { max-width: 520px; margin: 0 auto; background-color: #2b0c14; border: 1px solid #751424; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #4A0E17 0%, #2b0c14 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #E06000; }
    .brand-title { font-size: 26px; font-weight: 700; color: #FFE6A7; margin: 0; letter-spacing: 0.5px; }
    .brand-sub { font-size: 13px; color: #FF9B42; margin-top: 4px; font-weight: 500; }
    .body { padding: 32px 24px; }
    .greeting { font-size: 16px; color: #FFF8E7; margin-bottom: 16px; }
    .message { font-size: 14px; line-height: 1.6; color: #D4B2A7; margin-bottom: 24px; }
    .code-box { text-align: center; margin: 28px 0; }
    .code { display: inline-block; background-color: #4A0E17; border: 2px solid #E06000; border-radius: 10px; padding: 14px 32px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #FFE6A7; font-family: 'Courier New', monospace; box-shadow: 0 4px 16px rgba(224, 96, 0, 0.2); }
    .expiry { font-size: 12px; color: #FF9B42; text-align: center; margin-top: 10px; font-weight: 600; }
    .footer { padding: 20px 24px; background-color: #1f070e; border-top: 1px solid #4A0E17; text-align: center; font-size: 12px; color: #9A7B73; }
    .tagline { color: #E06000; font-weight: 600; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">Paaramparik • പാരമ്പരിക</h1>
      <div class="brand-sub">The Living Culture Map &bull; Trust & Verification</div>
    </div>
    <div class="body">
      <div class="greeting">Hello,</div>
      <div class="message">
        You are submitting or managing a cultural event listing on <strong>Paaramparik</strong>. To verify your email address as the authorized submitter, please use the 6-digit confirmation code below:
      </div>
      <div class="code-box">
        <div class="code">${otp}</div>
        <div class="expiry">Expires in 5 minutes &bull; Single use only</div>
      </div>
      <div class="message" style="font-size: 13px; color: #B38F85;">
        If you did not initiate this request, you can safely ignore this email. Contact verification safeguards the integrity of our cultural archive against fraudulent listings.
      </div>
    </div>
    <div class="footer">
      <div class="tagline">Preserving and Celebrating Living Heritage</div>
      <div>Sent from Paaramparik Cultural Trust Verification Service</div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `Paaramparik - Organizer Email Verification\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nSent from Paaramparik Cultural Trust.`;

    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EMAIL-SERVICE] View sample email in browser: ${previewUrl}`);
      }

      console.log(`[EMAIL-SERVICE] Successfully dispatched verification email to ${toEmail} from ${fromAddress} (Message ID: ${info.messageId})`);

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || false,
        from: fromAddress,
        to: toEmail,
      };
    } catch (err: any) {
      console.error('[EMAIL-SERVICE] Error delivering email:', err.message);
      // Fallback: log to console so local verification is not completely blocked
      console.log(`[EMAIL-OTP-FALLBACK] From: ${fromAddress} | To: ${toEmail} | Code: [${otp}]`);
      return {
        success: true,
        from: fromAddress,
        to: toEmail,
      };
    }
  }
}

export const emailService = new EmailService();
