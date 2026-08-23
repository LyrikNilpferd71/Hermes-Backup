---
name: elevenlabs-conversational-agent
description: "Use for ElevenLabs voice agents with Supabase webhooks."
category: mlops
tags: [elevenlabs, voice-agent, twilio, supabase, edge-functions, webhook, telegram, eu-ai-act]
---

# ElevenLabs Conversational Agent

Build production-ready voice agents using ElevenLabs Conversational AI, Supabase Edge Functions, and Hermes Agent.

## Architecture Overview

```
Caller → Twilio → ElevenLabs Agent
                      │
                      ├── Personalization Webhook (Edge Function)
                      │   ├── Check priority window (time + weekday)
                      │   ├── Return dynamic_variables to agent
                      │   └── Send Telegram notification to owner
                      │
                      └── Post-Call Webhook (Edge Function)
                          ├── Validate + deduplicate by call_sid
                          └── INSERT into Supabase call_log (RPC)
```

## Components

### 1. Supabase Backend

**Table:** `public.hermes2_call_log` (or your schema)
**RPC:** `public.insert_call_log()` — SECURITY DEFINER, handles upsert

```sql
CREATE TABLE public.hermes2_call_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid         TEXT NOT NULL UNIQUE,
  caller_number    TEXT NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  category         TEXT,
  priority         BOOLEAN DEFAULT FALSE,
  outcome          TEXT,
  ticket_id        TEXT,
  transcript       TEXT,       -- NULL unless explicit consent given
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### 2. Edge Function #1 — Personalization Webhook

Called by ElevenLabs at **call start**. Returns `dynamic_variables` to the agent.

**Input:** `{ caller_id, agent_id, called_number, call_sid }`
**Output:** `{ dynamic_variables: { priority_window, priority_window_start, priority_window_end, timezone } }`

**Logic:**
- Pure clock check — no LLM, no DB call
- Configurable: priority window hours, weekdays-only toggle, timezone
- Async Telegram notification (send message to owner via bot)

**Secrets:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_CHAT_ID`

### 3. Edge Function #2 — Post-Call Webhook

Called by ElevenLabs at **call end**. Writes to call_log.

**Input:** `{ call_sid, caller_number, started_at, duration_seconds, category, priority, outcome, ticket_id, consent_given, transcript }`
**Output:** `{ success, row_id }`

**Privacy rule:** `transcript` is stored ONLY if `consent_given === true`. Otherwise `NULL`.

**Secrets:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (auto-injected by Supabase runtime)

### 4. Telegram Notification

Personalization webhook sends a message to the owner's Telegram:

```
🔴 Eingehender Anruf
Zeit: 12.08.2026, 15:59
Anrufer: +49123456789
Angerufen: +4930123456
Call SID: abc-123
Status: Außerhalb der Geschäftszeiten
```

### 5. ElevenLabs Agent Config

Configure the Agent in ElevenLabs Dashboard:
- **Personalization webhook URL:** `https://<project>.supabase.co/functions/v1/personalization-webhook`
- **Post-call webhook URL:** `https://<project>.supabase.co/functions/v1/post-call-webhook`
- **Tools:** `transfer_to_owner`, `create_support_ticket`, `check_ticket_status`

### 6. AI Disclosure Sentence (EU AI Act Art. 50)

Must be the agent's opening line. Required by EU AI Act Art. 50 before any functional interaction.

**German:**
> „Hallo, hier ist der AI Support Agent von [Name]. Ich bin ein KI-Assistent und dieses Gespräch kann aufgezeichnet werden. Wie kann ich Ihnen helfen?"

**English:**
> "Hello, this is the AI support agent from [Name]. This is an AI assistant and this call may be recorded. How can I help you?"

## Deployment

### Supabase CLI

```bash
# Install
npm install -g supabase

# Login with PAT
supabase login --token sbp_<your-pat>

# Link project
supabase link --project-ref <project-ref>

# Deploy SQL (RPC functions)
# Use Management API or SQL Editor
curl -X POST "https://api.supabase.com/v1/projects/<ref>/database/query" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE OR REPLACE FUNCTION ..."}'

# Deploy functions
mkdir -p supabase/functions/<name>
cp index.ts supabase/functions/<name>/
supabase functions deploy <name> --project-ref <ref>

# Disable JWT verification (for webhooks called by ElevenLabs)
curl -X PATCH "https://api.supabase.com/v1/projects/<ref>/functions/<slug>" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt": false}'

# Set secrets
supabase secrets set KEY=VALUE --project-ref <ref>
```

### Supabase Secrets (auto-injected)
- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key

### Custom Secrets (set manually)
- `TELEGRAM_BOT_TOKEN` — for Telegram notifications
- `TELEGRAM_OWNER_CHAT_ID` — owner's Telegram user ID

## Hermes Profile Setup

Create a separate Hermes profile for the voice agent:

```bash
hermes profile create <name>
# Creates: ~/.hermes/profiles/<name>/
# Creates: ~/.local/bin/<name> wrapper script

# Copy config
cp /opt/<name>/config.yaml ~/.hermes/profiles/<name>/
cp /opt/<name>/.env ~/.hermes/profiles/<name>/

# Set up gateway
<name> gateway install
<name> gateway start
```

The profile has its own Telegram bot, config, and sessions — fully isolated from the main Hermes instance.

## Weekly Backup

Use systemd user timer for code/config backup (no PII, no call logs in git):

```bash
# Service unit
cp hermes-2-backup.service ~/.config/systemd/user/
# Timer unit — Sun 14:00 Europe/Berlin
cp hermes-2-backup.timer ~/.config/systemd/user/

systemctl --user daemon-reload
systemctl --user enable hermes-2-backup.timer
systemctl --user start hermes-2-backup.timer
```

## Priority Window Pattern

Pure clock logic — no LLM calls:

```typescript
const windows = [
  { start: 11, end: 12 },   // 11:00–12:00
  { start: 13.5, end: 16 }, // 13:30–16:00
];
const WEEKDAYS_ONLY = true; // Mo–Fr
const TIMEZONE = "Europe/Berlin";
```

## Referenced Files

- `references/elevenlabs-webhooks.md` — webhook payload schemas
- `references/supabase-edge-functions-setup.md` — deploying Edge Functions
- `references/eu-ai-act-disclosure.md` — AI disclosure requirements

## Pitfalls

- **JWT verification:** Edge Functions default to `verify_jwt: true`. Disable it explicitly for webhooks called by external services
- **SUPABASE_ prefix:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase runtime. Do NOT set them manually via `supabase secrets set` — they will be rejected
- **Transcript privacy:** Never store transcripts without explicit spoken consent (EU GDPR + AI Act). Default to `NULL`
- **Call dedup:** Post-call webhook may fire multiple times (retries). Use `ON CONFLICT (call_sid) DO UPDATE` in the RPC
- **Edge Function deployment path:** The CLI requires `supabase/functions/<name>/index.ts` relative to workdir. A `supabase/` subdirectory is created by `supabase link`
- **Time zone:** `Intl.DateTimeFormat` with `timeZone: "Europe/Berlin"` respects DST (CEST/CET) automatically