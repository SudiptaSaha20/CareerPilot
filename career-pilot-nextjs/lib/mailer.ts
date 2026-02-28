import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOtpEmail(
  to: string,
  otp: string,
  type: "verify" | "reset"
) {
  const subject =
    type === "verify"
      ? "Verify your CareerPilot account"
      : "Reset your CareerPilot password";

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0d1117; color: #e6edf3; padding: 40px; border-radius: 16px; border: 1px solid #1e2938;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 32px;">
        <span style="font-size: 20px; font-weight: 700; color: #22d3ee;">⚡ CareerPilot</span>
      </div>
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">
        ${type === "verify" ? "Verify your email" : "Reset your password"}
      </h2>
      <p style="color: #8b949e; margin-bottom: 32px;">
        ${type === "verify"
          ? "Enter the code below to verify your CareerPilot account."
          : "Use this code to reset your password."
        }
      </p>
      <div style="background: #161b22; border: 1px solid #1e2938; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #22d3ee; font-family: 'JetBrains Mono', monospace;">
          ${otp}
        </div>
        <p style="color: #8b949e; font-size: 13px; margin-top: 12px;">
          This code expires in <strong style="color: #e6edf3;">10 minutes</strong>
        </p>
      </div>
      <p style="color: #8b949e; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"CareerPilot" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
