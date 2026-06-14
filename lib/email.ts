import "server-only";
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured");
  }
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "クスリ飲み手帳 <noreply@localhost>";
}

function getAuthUrl() {
  const url = process.env.AUTH_URL?.trim();
  if (url) {
    try {
      return new URL(url).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3000";
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMedicationReminderEmail(
  to: string,
  data: { medName: string; slotTime: string; type: "pre_dose" | "overdue_hourly" }
) {
  const medsUrl = `${getAuthUrl()}/medications`;
  const transporter = getTransporter();

  const isPre = data.type === "pre_dose";
  const subject = isPre
    ? `【クスリ飲み手帳】${data.slotTime}の服薬予定（1時間前）`
    : `【クスリ飲み手帳】服薬の記録をお願いします`;
  const text = isPre
    ? `${data.medName} の服用予定（${data.slotTime}）まであと約1時間です。\n\n記録はこちら: ${medsUrl}`
    : `${data.medName}（${data.slotTime}）の服用がまだ記録されていません。\n\n今すぐ記録: ${medsUrl}`;

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html: `<p>${text.replace(/\n/g, "<br>")}</p><p><a href="${medsUrl}">服薬ページを開く</a></p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${getAuthUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "【クスリ飲み手帳】パスワード再設定",
    text: `パスワード再設定のリクエストを受け付けました。

以下のリンクから新しいパスワードを設定してください（1時間有効）:
${resetUrl}

心当たりがない場合は、このメールを無視してください。`,
    html: `<p>パスワード再設定のリクエストを受け付けました。</p>
<p><a href="${resetUrl}">パスワードを再設定する</a></p>
<p>リンクが開けない場合: ${resetUrl}</p>
<p>心当たりがない場合は、このメールを無視してください。</p>`,
  });
}
