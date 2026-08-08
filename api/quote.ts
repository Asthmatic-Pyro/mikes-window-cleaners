import process from "node:process";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type QuoteBody = {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  message?: string;
};

/** Strip wrapping quotes people often paste into Vercel env UI. */
function env(name: string) {
  const raw = process.env[name]?.trim() ?? "";
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  if (!env("RESEND_API_KEY")) {
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  const to = env("CONTACT_TO_EMAIL");
  const from = env("EMAIL_FROM");

  if (!to || !from) {
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  let body: QuoteBody;
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const service = body.service?.trim() ?? "Not specified";
  const message = body.message?.trim() ?? "";

  if (!name || !phone) {
    return Response.json({ error: "Name and phone are required." }, { status: 400 });
  }

  const safe = {
    name: escapeHtml(name),
    phone: escapeHtml(phone),
    email: escapeHtml(email || "Not provided"),
    service: escapeHtml(service),
    message: escapeHtml(message || "No details provided.").replaceAll("\n", "<br />"),
  };

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email || undefined,
    subject: `New quote request from ${name}`,
    html: `
      <h2>New quote request</h2>
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Phone:</strong> ${safe.phone}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Service:</strong> ${safe.service}</p>
      <p><strong>Details:</strong><br />${safe.message}</p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return Response.json(
      { error: error.message || "Could not send quote request." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, id: data?.id });
}
