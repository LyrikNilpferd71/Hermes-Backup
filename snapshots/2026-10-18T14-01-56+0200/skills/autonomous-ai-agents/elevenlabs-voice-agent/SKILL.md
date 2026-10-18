---
name: elevenlabs-voice-agent
description: "ElevenLabs voice agents with Hermes and Supabase."
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [elevenlabs, voice, conversational-ai, supabase, edge-functions, hermes, telephony]
    related_skills: [hermes-agent, github-repo-management]
---

# ElevenLabs Conversational AI Agent — Hermes + Supabase

A class-level architecture for wiring ElevenLabs Conversational AI agents to Hermes (via Telegram) and Supabase (via Edge Functions). Covers the full stack: call routing, logging, tool definitions, and backup.

**Key principle:** Prefer Supabase Edge Functions over n8n or VPS-hosted webhooks for ElevenLabs call processing. Edge Functions are serverless, colocated with your DB, and zero-maintenance.

---

## Architecture Overview

```
Caller → Twilio → ElevenLabs Agent
                        │
                        ├── Personalization Webhook → Supabase Edge Function #1
                        │      (time-window check, returns dynamic_variables)
                        │
                        ├── Tool Calls → ElevenLabs tools
                        │      (transfer_to_owner, create_support_ticket, check_ticket_status)
                        │
                        └── Post-Call Webhook → Supabase Edge Function #2
                               (writes to hermes2.call_log via service_role key)
                                        │
                                        └── Supabase DB (hermes2 schema)

Hermes-2 (separate instance) ← Telegram Bot (new, per agent)
  └── Weekly backup to GitHub (code/config only, no PII)
```

---

## Key Pattern: Add Telegram Notification to Personalization Webhook

The personalization webhook can notify the agent owner via Telegram when a call comes in. This is a **fire-and-forget** side effect — the notification is sent asynchronously and does not block the response.

**Implementation:**
```typescript
async function sendTelegramNotification(payload, priorityWindow: boolean): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  const chatId = Deno.env.get("TELEGRAM_OWNER_CHAT_ID") || "";
  if (!botToken || !chatId) return; // silent skip if not configured

  const message =
    `${priorityWindow ? "🟢" : "🔴"} *Eingehender Anruf*\n` +
    `Anrufer: \`${payload.caller_id}\`\n` +
    `Angerufen: \`${payload.called_number}\`\n` +
    `Call SID: \`${payload.call_sid}\`\n` +
    `Status: ${priorityWindow ? "Priority Window" : "Außerhalb der Geschäftszeiten"}`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: parseInt(chatId, 10), text: message, parse_mode: "Markdown" }),
  });
}
```

**Secrets to set on the Edge Function:**
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=<bot_token> --project-ref <ref>
supabase secrets set TELEGRAM_OWNER_CHAT_ID=<user_id> --project-ref <ref>
```

The notification is sent from the same bot that Hermes uses for the agent. The chat ID is the owner's Telegram user ID (from @userinfobot).

---

## Setup Steps

### 1. Directory Structure

```
/opt/hermes-2/
├── .env                        # Secrets (no PII in git)
├── config.yaml                 # Hermes-2 config (separate from main Hermes)
├── supabase/
│   ├── migration.sql           # CREATE TABLE + RPC function
│   ├── personalization-webhook/
│   │   ├── index.ts            # Clock-check logic (no LLM)
│   │   └── supabase.json
│   └── post-call-webhook/
│       ├── index.ts            # DB insert via service_role key
│       └── supabase.json
├── elevenagents/
│   └── agent-config.json       # Agent + tools definition
├── backup/
│   ├── backup-self.sh          # Git backup script
│   ├── .gitignore              # No .env, no logs, no transcripts
│   └── README.md
└── systemd/
    ├── hermes-2-backup.service
    └── hermes-2-backup.timer   # Sun 14:00 Europe/Berlin
```

### 2. SQL Migration (Supabase)

Create a separate schema (`hermes2`) for logical isolation. Include an RPC function for the post-call webhook to call — this allows the Edge Function to insert via the REST API without direct schema access.

**Table columns:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto-generated |
| `call_sid` | TEXT UNIQUE NOT NULL | from ElevenLabs |
| `caller_number` | TEXT NOT NULL | |
| `started_at` | TIMESTAMPTZ NOT NULL | |
| `duration_seconds` | INTEGER | default 0 |
| `category` | TEXT | 'support', 'billing', 'general' |
| `priority` | BOOLEAN | default false |
| `outcome` | TEXT | 'resolved', 'escalated', 'callback_requested' |
| `ticket_id` | TEXT | reference to support ticket |
| `transcript` | TEXT | NULL unless explicit spoken consent |
| `created_at` | TIMESTAMPTZ | default now() |

**RPC function** (`public.insert_call_log`): SECURITY DEFINER, SET search_path = 'hermes2'. Handles upsert on duplicate call_sid.

### 3. Edge Function #1: Personalization Webhook

Receives ElevenLabs call-start payload, returns `dynamic_variables`.

**Pure logic, no LLM call.** The function:
- Gets current time in Europe/Berlin
- Compares against configured priority window (e.g. Mo–Fr 11:00–12:00 & 13:30–16:00)
- Returns `{ priority_window: true/false, priority_window_start, priority_window_end, timezone }`

**Config constants** (adjustable):
- `PRIORITY_WINDOW_START_1`, `PRIORITY_WINDOW_END_1`
- `PRIORITY_WINDOW_START_2`, `PRIORITY_WINDOW_END_2`
- `WEEKDAYS_ONLY: true` (Mo–Fr only)

### 4. Edge Function #2: Post-Call Webhook

Receives post-call payload, writes to `hermes2.call_log` via `service_role` key.

**Privacy rule:** `transcript` is only stored if `consent_given === true` in the payload. Otherwise `transcript = NULL`.

**Dedup:** The RPC function handles `ON CONFLICT (call_sid) DO UPDATE` — replaying a webhook updates rather than duplicates.

### 5. ElevenAgents Tool Configuration

Three standard tools for a support agent:

| Tool | Condition | Action |
|------|-----------|--------|
| `transfer_to_owner` | Only when `priority_window == true` | Twilio dial to owner's number |
| `create_support_ticket` | Always | Webhook or API call to ticket system |
| `check_ticket_status` | Always | Read-only self-service lookup |

**Tool schema** (JSON placed in `elevenagents/agent-config.json`):
- Each tool has `name`, `description`, `action` (twilio_dial or webhook), `parameters` with types
- Agent config includes `personalization_webhook_url` and `post_call_webhook_url`

### 6. AI Disclosure Sentence (EU AI Act Art. 50)

The agent's opening line MUST include spoken AI-disclosure before describing function. Draft:

**German:** "Hallo, hier ist der AI Support Agent von [Company]. Ich bin ein KI-Assistent und dieses Gespräch kann aufgezeichnet werden. Wie kann ich Ihnen helfen?"

**English:** "Hello, this is the AI support agent from [Company]. This is an AI assistant and this call may be recorded. How can I help you?"

Show the draft to the user for approval before going live — the exact wording has legal implications.

### 7. Hermes-2 Instance (Separate Telegram Bot)

- Separate `config.yaml` at `/opt/hermes-2/config.yaml`
- Separate `.env` with own Telegram bot token (new bot from @BotFather)
- Separate OpenRouter API key for independent billing
- `config.yaml` mirrors the main Hermes config with minimal changes (model, Telegram, timezone)

### 8. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login (needs Supabase Access Token from dashboard)
# Go to https://supabase.com/dashboard/account/tokens → Generate new token
supabase login --token <PAT>

# Link to existing project
supabase link --project-ref <project_ref>

# Deploy
supabase functions deploy personalization-webhook --project-ref <ref>
supabase functions deploy post-call-webhook --project-ref <ref>
```

**Pitfall: Directory structure.** The Supabase CLI expects functions at `./supabase/functions/<name>/index.ts`. Running `supabase link` creates a `supabase/` directory in the current directory. Run from a clean project root:

```bash
mkdir -p /tmp/supabase-project/supabase/functions
cp -r ./functions/* /tmp/supabase-project/supabase/functions/
cd /tmp/supabase-project && supabase link --project-ref <ref>
supabase functions deploy <name> --project-ref <ref>
```

**Pitfall: JWT verification.** By default, Edge Functions require a valid Supabase JWT. For ElevenLabs webhooks, disable JWT verification:

```bash
# Via Management API (needs PAT, not service_role key)
curl -X PATCH "https://api.supabase.com/v1/projects/<ref>/functions/<name>" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt": false}'
```

**Pitfall: Auto-injected env vars.** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by the Supabase runtime. Do NOT set them manually via `supabase secrets set` — names starting with `SUPABASE_` are rejected.

**Pitfall: Running SQL migration.** `supabase db query --file` connects to a local database, not the remote. Use the Management API directly:

```bash
SQL=$(cat migration.sql | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
curl -X POST "https://api.supabase.com/v1/projects/<ref>/database/query" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $SQL}"
```

### 9. Set Secrets on Edge Functions

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=<token> --project-ref <ref>
supabase secrets set TELEGRAM_OWNER_CHAT_ID=<user_id> --project-ref <ref>
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected — no need to set them.

### 10. Hermes-2 Profile + Gateway

Use `hermes profile create` to set up a second Hermes instance with its own gateway:

```bash
hermes profile create hermes-2
# Copy config.yaml and .env into the profile
cp /opt/hermes-2/config.yaml ~/.hermes/profiles/hermes-2/
cp /opt/hermes-2/.env ~/.hermes/profiles/hermes-2/
# Start gateway
hermes-2 gateway install
hermes-2 gateway start
```

This creates:
- Profile at `~/.hermes/profiles/hermes-2/`
- CLI wrapper `hermes-2` for the profile
- Systemd service `hermes-gateway-hermes-2.service`
- Separate logs, sessions, skills, and memory

### 11. Weekly Backup (Sun 14:00 Europe/Berlin)

Backup script mirrors the `Hermes-Backup/backup-self.sh` pattern:
- **Backs up:** `config.yaml`, `supabase/`, `elevenagents/`, `systemd/`
- **Does NOT back up:** `.env` (secrets), call logs (live in Supabase), phone numbers, transcripts
- **GitHub repo:** `LyrikNilpferd71/Hermes2-Backup`

Systemd user units:
- `hermes-2-backup.service` — runs backup-self.sh
- `hermes-2-backup.timer` — `OnCalendar=Sun 14:00:00 Europe/Berlin`

---

## Reference Files

See `references/` for concrete templates:
- `references/migration.sql` — full SQL migration (schema + RPC function)
- `references/agent-config.json` — ElevenAgents agent + tool config
- `references/personalization-webhook.ts` — Edge Function #1 source
- `references/post-call-webhook.ts` — Edge Function #2 source

---

## Pitfalls & Lessons

### n8n vs Supabase Edge Functions
- **Do NOT** stand up n8n workflows or VPS webhook servers for ElevenLabs call processing. Edge Functions are serverless, co-located with the DB, and free-tier eligible.
- n8n is fine for other automation; for ElevenLabs webhooks specifically, use Edge Functions.

### Privacy
- **Never** store `transcript` unless the caller gave explicit spoken consent (`consent_given` flag in ElevenLabs payload).
- **Never** put phone numbers, call content, or .env files in git. The backup repo has a `.gitignore` that blocks these.
- The `service_role` key bypasses RLS — use it only in Edge Functions that the public does not call directly.

### Priority Window
- Edge Functions run in UTC internally. Always use `Intl.DateTimeFormat` with `timeZone: "Europe/Berlin"` for timezone-aware checks.
- Compare against the configured window, not hardcoded assumptions. Show the window to the user and let them confirm.

### Edge Function Design
- **No LLM calls** in Edge Functions — they should be pure logic (clock check, DB insert).
- Keep `verify_jwt: false` in `supabase.json` since ElevenLabs calls these directly.
- Use `SECURITY DEFINER` RPC functions to allow cross-schema writes from the REST API.

### AI Disclosure
- EU AI Act Art. 50 requires disclosure at the *start* of the interaction, before the assistant's function description.
- The opening line must be in the caller's language. If the agent supports multiple languages, provide separate opening lines per language.
- Show the final wording to the user before going live — it's a legal/compliance issue, not just a UX choice.

### Telegram Bot
- Create a new bot via @BotFather for each agent instance. Do not reuse tokens.
- Allowlist with `TELEGRAM_ALLOWED_USERS=7666040524` (or the user's ID).
- Never paste a bot token in chat — if you do, advise the user to rotate it.

### Separation
- Keep `/opt/hermes-2/` completely separate from the main Hermes instance (`~/.hermes/`).
- Separate `.env`, separate config.yaml, separate systemd units.
- Do not modify the main Hermes service files, cron, or .env as part of the setup.