// Edge Function: ElevenLabs Personalization Webhook
// Pure clock logic — no LLM, no DB. Returns dynamic_variables for the agent.
// Sends a Telegram notification to the owner about incoming calls.

interface PersonalizationPayload {
  caller_id: string;
  agent_id: string;
  called_number: string;
  call_sid: string;
}

interface PersonalizationResponse {
  dynamic_variables: {
    priority_window: boolean;
    priority_window_start: string;
    priority_window_end: string;
    timezone: string;
  };
}

// --- CONFIGURATION ---
const PRIORITY_WINDOW_START_1 = 11;
const PRIORITY_WINDOW_END_1 = 12;
const PRIORITY_WINDOW_START_2 = 13.5;
const PRIORITY_WINDOW_END_2 = 16;
const TIMEZONE = "Europe/Berlin";
const WEEKDAYS_ONLY = true;
// --- END CONFIG ---

function isInPriorityWindow(): boolean {
  const now = new Date();
  const berlin = new Intl.DateTimeFormat("de-DE", {
    timeZone: TIMEZONE,
    hour: "numeric", hour12: false,
    minute: "numeric", weekday: "short",
  }).formatToParts(now);

  const getPart = (type: string): string =>
    berlin.find((p) => p.type === type)?.value ?? "0";

  const hour = parseInt(getPart("hour"), 10);
  const minute = parseInt(getPart("minute"), 10);
  const weekday = getPart("weekday");

  if (WEEKDAYS_ONLY) {
    if (!["Mo", "Di", "Mi", "Do", "Fr"].includes(weekday)) return false;
  }

  const timeDecimal = hour + minute / 60;
  if (timeDecimal >= PRIORITY_WINDOW_START_1 && timeDecimal < PRIORITY_WINDOW_END_1) return true;
  if (timeDecimal >= PRIORITY_WINDOW_START_2 && timeDecimal < PRIORITY_WINDOW_END_2) return true;
  return false;
}

async function sendTelegramNotification(payload: PersonalizationPayload, priorityWindow: boolean): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  const chatId = Deno.env.get("TELEGRAM_OWNER_CHAT_ID") || "";
  if (!botToken || !chatId) return;

  const now = new Intl.DateTimeFormat("de-DE", {
    timeZone: TIMEZONE, dateStyle: "short", timeStyle: "short",
  }).format(new Date());

  const icon = priorityWindow ? "🟢" : "🔴";
  const windowText = priorityWindow
    ? "Priority Window — Anruf wird angenommen"
    : "Außerhalb der Geschäftszeiten";

  const message =
    `${icon} *Eingehender Anruf*\n` +
    `Zeit: ${now}\n` +
    `Anrufer: \`${payload.caller_id}\`\n` +
    `Angerufen: \`${payload.called_number}\`\n` +
    `Call SID: \`${payload.call_sid}\`\n` +
    `Status: ${windowText}`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: parseInt(chatId, 10), text: message, parse_mode: "Markdown" }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload: PersonalizationPayload = await req.json();
    const priorityWindow = isInPriorityWindow();

    sendTelegramNotification(payload, priorityWindow);

    return new Response(JSON.stringify({
      dynamic_variables: {
        priority_window: priorityWindow,
        priority_window_start: `${String(PRIORITY_WINDOW_START_1).padStart(2, "0")}:00`,
        priority_window_end: `${String(PRIORITY_WINDOW_END_2).padStart(2, "0")}:00`,
        timezone: TIMEZONE,
      },
    } satisfies PersonalizationResponse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Personalization webhook error:", err);
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});