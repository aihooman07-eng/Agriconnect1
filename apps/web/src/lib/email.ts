import { Resend } from "resend";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fromAddress(): string {
  const v = process.env.EMAIL_FROM_AGRICONNECT;
  if (!v?.trim()) {
    throw new Error("EMAIL_FROM_AGRICONNECT is not set.");
  }
  return v.trim();
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key?.trim()) {
    console.warn(
      `[email] RESEND_API_KEY missing — would send "${params.subject}" to ${params.to}`,
    );
    return { skipped: true as const };
  }
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  return { skipped: false as const, result };
}

export async function sendFarmerLoginOtpEmail(toEmail: string, code: string) {
  await sendEmail({
    to: toEmail,
    subject: "Your AgriConnect login code",
    html: `
      <p>Use this code to sign in:</p>
      <p style="font-size: 24px; font-weight: 700;">${escapeHtml(code)}</p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

export async function sendFarmRejectedEmail(toEmail: string, farmName: string, reason: string) {
  await sendEmail({
    to: toEmail,
    subject: `AgriConnect listing needs changes: ${farmName}`,
    html: `
      <p>Your farm listing "<strong>${escapeHtml(farmName)}</strong>" was not approved yet.</p>
      <p><strong>Coordinator note:</strong></p>
      <p>${escapeHtml(reason)}</p>
      <p>Please update your listing in the farmer portal and submit again.</p>
    `,
  });
}

export async function sendFarmerNewInquiryEmail(params: {
  to: string;
  farmName: string;
  viewerEmail: string;
  summary: string;
}) {
  await sendEmail({
    to: params.to,
    subject: `New visitor inquiry — ${params.farmName}`,
    html: `
      <p>You have a new inquiry for <strong>${escapeHtml(params.farmName)}</strong>.</p>
      <p><strong>Visitor email:</strong> ${escapeHtml(params.viewerEmail)}</p>
      <p>${escapeHtml(params.summary).replaceAll("\n", "<br/>")}</p>
    `,
  });
}

export async function sendVisitorInquiryConfirmation(toEmail: string, farmName: string) {
  await sendEmail({
    to: toEmail,
    subject: `We received your AgriConnect inquiry — ${farmName}`,
    html: `
      <p>Thanks — we emailed the host farm about your visit idea for "<strong>${escapeHtml(farmName)}</strong>".</p>
      <p>Hosts reply directly; AgriConnect does not guarantee availability until you coordinate dates together.</p>
    `,
  });
}
