import { applicationScore, contactKind, yearsOld } from "./interestedRules.js";
import { adminClient, sendTelegramOnly, sendTelegramPhoto } from "./telegram.js";

type Tone = "platonic" | "romantic";
type Meet = "meetup" | "date";

type Body = {
  name?: string;
  dob?: string;
  city?: string;
  job?: string;
  tone?: string;
  meet?: string;
  why?: string;
  contact?: string;
  consent?: boolean;
  photo?: string;
  retryPhoto?: boolean;
  reference?: string;
};

const TONES = new Set<Tone>(["platonic", "romantic"]);
const MEETS = new Set<Meet>(["meetup", "date"]);
const TONE_LABEL: Record<Tone, string> = {
  platonic: "Platonic",
  romantic: "Romantic",
};
const MEET_LABEL: Record<Meet, string> = {
  meetup: "A meetup",
  date: "A date",
};

const recentSends = new Map<string, number[]>();

function referenceCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return `MG-${code}`;
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const real = request.headers.get("x-real-ip")?.trim() ?? "";
  return (forwarded || real || "unknown").slice(0, 80);
}

async function ipHash(request: Request) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clientKey(request)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function memoryLimited(key: string) {
  const now = Date.now();
  const windowMs = 30 * 60 * 1000;
  const stamps = (recentSends.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (stamps.length >= 5) {
    recentSends.set(key, stamps);
    return true;
  }
  stamps.push(now);
  recentSends.set(key, stamps);
  if (recentSends.size > 400) {
    for (const [id, times] of recentSends) {
      if (times.every((stamp) => now - stamp >= windowMs)) recentSends.delete(id);
    }
  }
  return false;
}

async function overLimit(hash: string) {
  if (memoryLimited(hash)) return true;
  const admin = adminClient();
  if (!admin) return false;
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const tenAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [mine, all] = await Promise.all([
    admin
      .from("notification_log")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "interested-rl")
      .like("event_key", `${hash}:%`)
      .gte("sent_at", hourAgo),
    admin
      .from("notification_log")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "interested-rl")
      .gte("sent_at", tenAgo),
  ]);
  if (mine.error || all.error) {
    console.error("interested rate limit:", mine.error?.message || all.error?.message);
    return false;
  }
  return (mine.count ?? 0) >= 4 || (all.count ?? 0) >= 20;
}

/** Counts sends for the burst limit. The row is a hash and a reference, not the application. */
async function markSend(hash: string, key: string) {
  const admin = adminClient();
  if (!admin) return;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  void admin.from("notification_log").delete().eq("event_type", "interested-rl").lt("sent_at", dayAgo);
  const { error } = await admin.from("notification_log").insert({
    event_type: "interested-rl",
    event_key: `${hash}:${key}`,
  });
  if (error) console.error("interested rate mark:", error.message);
}

function limited() {
  return Response.json({ error: "That's enough for now. Try again in a little while." }, { status: 429 });
}

export async function handleInterested(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "That did not come through. Try again." }, { status: 400 });
  }

  if (body.retryPhoto) return retryPhoto(request, body);

  if (!body.consent) {
    return Response.json({ error: "Check the box so Mike knows you want him to read this." }, { status: 400 });
  }

  const name = clip(body.name ?? "", 80);
  const city = clip(body.city ?? "", 80);
  const job = clip(body.job ?? "", 120);
  const why = clip(body.why ?? "", 800);
  const contact = clip(body.contact ?? "", 120);
  const dob = (body.dob ?? "").trim();
  const tone = body.tone ?? "";
  const meet = body.meet ?? "";

  if (name.length < 1) return Response.json({ error: "Add your first name." }, { status: 400 });
  const age = yearsOld(dob);
  if (age === null || age < 21 || age > 110) {
    return Response.json({ error: "This is for women 21 or older." }, { status: 400 });
  }
  if (city.length < 2) return Response.json({ error: "Add the city you are in." }, { status: 400 });
  if (job.length < 2) return Response.json({ error: "Add what you do." }, { status: 400 });
  if (!TONES.has(tone as Tone) || !MEETS.has(meet as Meet)) {
    return Response.json({ error: "Pick platonic or romantic, and a meetup or a date." }, { status: 400 });
  }
  if (why.length < 20) {
    return Response.json({ error: "Write a little more about why him." }, { status: 400 });
  }
  const kind = contactKind(contact);
  if (!kind) {
    return Response.json({ error: "Use a phone number, an email, or a Telegram @name." }, { status: 400 });
  }

  const photo = decodePhoto(body.photo ?? "");
  if ((body.photo ?? "").trim() && !photo) {
    return Response.json({ error: "That photo didn't come through. Try a smaller one, or remove it and send." }, { status: 400 });
  }

  const hash = await ipHash(request);
  if (await overLimit(hash)) return limited();

  const score = applicationScore({ why, photo: photo ? "1" : "" });
  const reference = referenceCode();
  await markSend(hash, reference);
  const kindLabel = kind === "phone" ? "phone" : kind === "email" ? "email" : "Telegram";
  const text = [
    "Girlfriend application",
    `Ref ${reference}`,
    `Score ${score.points}/${score.of}`,
    "",
    name,
    `Age ${age}`,
    city,
    job,
    `Meet: ${TONE_LABEL[tone as Tone]} · ${MEET_LABEL[meet as Meet]}`,
    "",
    "Why him:",
    why,
    "",
    `Reach her (${kindLabel}):`,
    contact,
    photo ? "Photo: next message." : "No photo.",
  ].join("\n");

  const sent = await sendTelegramOnly(text);
  if (!sent) {
    return Response.json({ error: "That could not be sent. Try once more in a minute." }, { status: 503 });
  }

  let photoAttached = true;
  if (photo) {
    photoAttached = await sendTelegramPhoto(photo.bytes, photo.mime, `Photo · ${reference}`);
    if (!photoAttached) await sendTelegramOnly(`Photo for ${reference} did not attach.`);
  }

  return Response.json({ reference, photoAttached });
}

async function retryPhoto(request: Request, body: Body) {
  const reference = (body.reference ?? "").trim();
  if (!/^MG-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/.test(reference)) {
    return Response.json({ error: "That reference did not match." }, { status: 400 });
  }
  const photo = decodePhoto(body.photo ?? "");
  if (!photo) {
    return Response.json({ error: "That photo didn't come through. Try a smaller one." }, { status: 400 });
  }
  const hash = await ipHash(request);
  if (await overLimit(hash)) return limited();
  await markSend(hash, `${reference}:r${Date.now()}`);
  const photoAttached = await sendTelegramPhoto(photo.bytes, photo.mime, `Photo · ${reference}`);
  if (!photoAttached) await sendTelegramOnly(`Photo for ${reference} did not attach.`);
  return Response.json({ reference, photoAttached });
}

function decodePhoto(dataUrl: string) {
  const trimmed = dataUrl.trim();
  if (!trimmed) return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(trimmed);
  if (!match) return null;
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (bytes.length < 80 || bytes.length > 1_800_000) return null;
  return { bytes, mime: match[1] };
}
