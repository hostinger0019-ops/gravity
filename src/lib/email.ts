/**
 * Email service using Hostinger SMTP via Nodemailer.
 * Handles OTP codes, purchase receipts, and lead capture notifications.
 */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.hostinger.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true, // true for port 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER || "noreply@agentforja.com",
    pass: process.env.EMAIL_PASSWORD || "",
  },
});

// ── OTP Email ───────────────────────────────────────────────
export async function sendOTP(email: string, code: string) {
  await transporter.sendMail({
    from: '"Agent Forja" <noreply@agentforja.com>',
    to: email,
    subject: `${code} is your Agent Forja verification code`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">⚡ Agent Forja</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">AI Digital Employees</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <p style="color: #999; font-size: 14px; margin: 0 0 24px;">Your verification code is:</p>
          <div style="background: #111; border: 1px solid #333; border-radius: 12px; padding: 20px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #fff;">${code}</span>
          </div>
          <p style="color: #666; font-size: 13px; margin: 24px 0 0;">This code expires in <strong style="color: #999;">5 minutes</strong>.</p>
          <p style="color: #444; font-size: 12px; margin: 16px 0 0;">If you didn't request this, ignore this email.</p>
        </div>
        <div style="padding: 16px; text-align: center; border-top: 1px solid #222;">
          <p style="color: #444; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Agent Forja. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

// ── Purchase Receipt ────────────────────────────────────────
export async function sendReceipt(
  email: string,
  plan: string,
  amount: string,
  orderId: string
) {
  await transporter.sendMail({
    from: '"Agent Forja" <noreply@agentforja.com>',
    to: email,
    subject: `Payment Receipt — ${plan} Plan`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">✅ Payment Received</h1>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Plan</td><td style="color: #fff; text-align: right; font-size: 14px; font-weight: 600;">${plan}</td></tr>
            <tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Amount</td><td style="color: #fff; text-align: right; font-size: 14px; font-weight: 600;">${amount}</td></tr>
            <tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Order ID</td><td style="color: #fff; text-align: right; font-size: 14px;">${orderId}</td></tr>
            <tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Date</td><td style="color: #fff; text-align: right; font-size: 14px;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://agentforja.com" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>
        <div style="padding: 16px; text-align: center; border-top: 1px solid #222;">
          <p style="color: #444; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Agent Forja. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

// ── Lead Capture Notification ───────────────────────────────
export async function sendLeadNotification(
  ownerEmail: string,
  leadData: { name?: string; email?: string; phone?: string; message?: string; botName?: string }
) {
  await transporter.sendMail({
    from: '"Agent Forja" <noreply@agentforja.com>',
    to: ownerEmail,
    subject: `🎯 New Lead Captured — ${leadData.botName || "Your Bot"}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🎯 New Lead Captured!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${leadData.botName || "Your Bot"}</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${leadData.name ? `<tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Name</td><td style="color: #fff; text-align: right; font-size: 14px; font-weight: 600;">${leadData.name}</td></tr>` : ""}
            ${leadData.email ? `<tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Email</td><td style="color: #3b82f6; text-align: right; font-size: 14px;"><a href="mailto:${leadData.email}" style="color: #3b82f6;">${leadData.email}</a></td></tr>` : ""}
            ${leadData.phone ? `<tr><td style="color: #888; padding: 8px 0; font-size: 14px;">Phone</td><td style="color: #fff; text-align: right; font-size: 14px;">${leadData.phone}</td></tr>` : ""}
            ${leadData.message ? `<tr><td colspan="2" style="color: #888; padding: 16px 0 4px; font-size: 14px;">Message</td></tr><tr><td colspan="2" style="color: #ccc; font-size: 14px; background: #111; padding: 12px; border-radius: 8px;">${leadData.message}</td></tr>` : ""}
          </table>
          <p style="color: #666; font-size: 12px; margin: 20px 0 0;">Captured at ${new Date().toLocaleString("en-US")}</p>
        </div>
      </div>
    `,
  });
}
