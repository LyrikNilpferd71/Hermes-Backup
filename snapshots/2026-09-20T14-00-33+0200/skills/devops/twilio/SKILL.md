---
name: twilio
description: "Use for Twilio call forwarding: TwiML, CLI, logging."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [twilio, telephony, call-forwarding, twiml, devops]
    related_skills: []
---

# Twilio Call Forwarding Infrastructure

## Overview

Set up a Twilio phone number to forward incoming calls to a configurable target number using **TwiML Bins** (static TwiML hosted by Twilio — no serverless function required). The pattern uses a minimal Node.js project with only the `twilio` SDK as a dependency; .env parsing is done inline to keep deps at zero beyond Twilio.

Components:

- **`setup.js`** — one-shot: creates/updates a TwiML Bin with `<Dial>` to the target number, assigns it as the Voice URL for the phone number, optionally sets a Status Callback URL for logging.
- **`set-forward.js`** — CLI to change the forwarding target on the fly: updates the TwiML Bin content AND rewrites `FORWARD_TO_NUMBER` in `.env`.
- **`server.js`** — optional tiny HTTP server receiving Twilio status callbacks, appending lines to `calls.log`.

No AI, no speech, no LLM — pure telephony plumbing.

## When to Use

- You own a Twilio phone number and want incoming calls forwarded to another number.
- You need a CLI command to switch the forwarding target (e.g. between personal and work numbers) without opening the Twilio Console.
- You want minimal call logging (who called, when, how long) to a local file.
- You're building a stepping stone toward more complex Twilio voice flows and want a clean foundation.

**Don't use for:** Twilio SMS, IVR menus with user input, serverless Twilio Functions, ElevenLabs voice agents, or anything needing dynamic TwiML generation per call. Those need a public HTTP endpoint, not a TwiML Bin.

## Project Structure

```
/opt/twilio-call-forward/
├── .env                # Credentials + FORWARD_TO_NUMBER (git-ignored)
├── .env.example        # Template
├── package.json        # Deps: twilio SDK only
├── setup.js            # One-time: create TwiML Bin + configure number
├── set-forward.js      # CLI: change target number
├── server.js           # Optional: call logging HTTP server
├── calls.log           # Log file (git-ignored)
└── README.md
```

## Core Concepts

### TwiML Bins vs Twilio Functions

| Approach | Use Case |
|---|---|
| **TwiML Bin** (static) | Fixed `<Dial>`, `<Say>`, `<Gather>` — no per-call logic. Zero latency, zero hosting cost. |
| **Twilio Function / Serverless** | Dynamic TwiML per call (time-of-day routing, DB lookups). Needs hosting. |
| **Your own HTTP endpoint** | Full control. Needs public URL (ngrok, VPS). |

For simple call forwarding, a TwiML Bin is the right choice. It's free, instant, and managed by Twilio.

### Status Callbacks

Twilio can POST call lifecycle events to a URL you specify. The callback payload includes:

- `CallSid`, `From` (caller), `To` (your Twilio number)
- `CallStatus`: `initiated`, `ringing`, `in-progress`, `completed`, `busy`, `failed`, `no-answer`
- `CallDuration` (seconds) — only on `completed`

Set via `statusCallback` on the phone number, or per-call in TwiML `<Dial action=...>`.

### Phone Number Voice URL

The Voice URL is the endpoint Twilio fetches TwiML from when a call comes in. Point it to a TwiML Bin URL:

```
https://handler.twilio.com/twiml/EHxxxx
```

Can be set/unset via the API:
```js
client.incomingPhoneNumbers(phoneNumber).update({ voiceUrl, voiceMethod: 'POST' })
```

## Standard Recipe: Call Forwarding + CLI

### 1. Create project

```bash
mkdir twilio-call-forward && cd twilio-call-forward
npm init -y
npm install twilio
```

Set `"type": "module"` in `package.json` for ESM imports.

### 2. Inline .env parser (zero deps)

```js
function parseDotenv(raw) {
  const out = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}
```

### 3. .env vars

Required:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` — your Twilio number in E.164 (e.g. `+15054728799`)
- `FORWARD_TO_NUMBER` — target number in E.164

Optional:
- `STATUS_CALLBACK_URL` — public URL for call logging

### 4. Setup script (setup.js)

1. Load .env
2. Call `client.twimlBins.list()` to find existing bin starting with `Call-Forward →`
3. Create or update the TwiML Bin with:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <Response>
       <Dial>+FORWARD_TO_NUMBER</Dial>
   </Response>
   ```
4. Set Voice URL: `https://handler.twilio.com/twiml/<binSid>`
5. Optionally set `statusCallback` if `STATUS_CALLBACK_URL` is in .env

### 5. CLI switcher (set-forward.js)

```bash
node set-forward.js +49123456789
```

Steps:
1. Parse .env
2. Validate new number matches E.164 regex: `/^\+[1-9]\d{6,14}$/`
3. Find existing TwiML Bin by `friendlyName` prefix
4. Update Bin content + friendly name
5. Re-apply Voice URL
6. Rewrite `FORWARD_TO_NUMBER` in `.env` file

Rewriting .env:
```js
function updateForwardInEnv(raw, oldValue, newValue) {
  const escapedOld = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^(FORWARD_TO_NUMBER=)${escapedOld}\\s*$`, 'm');
  if (regex.test(raw)) return raw.replace(regex, `$1${newValue}`);
  return raw.replace(/^FORWARD_TO_NUMBER=.*$/m, `FORWARD_TO_NUMBER=${newValue}`);
}
```

### 6. Call logging server (server.js)

Minimal HTTP server, no Express needed:

```js
import { createServer } from 'http';
import { appendFileSync } from 'fs';

createServer((req, res) => {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const params = Object.fromEntries(new URLSearchParams(body));
    const line = `[${new Date().toISOString()}] | CALL_SID=${params.CallSid} | CALLER=${params.From} | STATUS=${params.CallStatus} | DURATION=${params.CallDuration}s\n`;
    appendFileSync('calls.log', line);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end('<?xml version="1.0"?><Response/>');
  });
}).listen(process.env.PORT || 3000);
```

Run behind ngrok or a reverse proxy for public access.

## Common Pitfalls

1. **Phone number format.** Twilio enforces E.164 — `+15054728799`, not `505-472-8799` or `+1 (505) 472-8799`. Validate before API calls.

2. **TwiML Bin friendly name collision.** If you create multiple bins with the same prefix, the loop may pick the wrong one. Use a deterministic naming scheme like `Call-Forward → <number>` and keep only one active.

3. **Status callback only on phone number config.** Setting `statusCallback` on the phone number config applies to ALL calls. If you need per-call logging, put the callback URL directly in the TwiML `<Dial action=...>` attribute.

4. **Twilio SDK upgrade.** The `twilio` npm package has gone through major versions. The `client.twimlBins` API (v5.x) may differ from `client.twiml.bins` (older). Check the docs if API calls fail with 404.

5. **.env rewrite precision.** If the old `FORWARD_TO_NUMBER` value contains regex special chars (`.` `+` `*` `?` etc.), escaping is required. The `updateForwardInEnv` function above handles this.

6. **Caller ID mismatch.** If `<Dial callerId="+X">+X</Dial>` uses the target number, Twilio may show that as the caller ID to the forwarded party. For a clean forwarding setup, use the Twilio number as callerId:
   ```xml
   <Dial callerId="+15054728799">+49123456789</Dial>
   ```
   But this requires the Twilio number to be verified for caller ID on the target carrier.

## Verification Checklist

- [ ] `.env` has all 4 required vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, FORWARD_TO_NUMBER)
- [ ] `node setup.js` completes without error, prints the Voice URL
- [ ] Twilio Console → Phone Numbers → Active Numbers → shows the correct TwiML Bin as Voice URL
- [ ] `node set-forward.js +NEWNUMBER` updates the forwarding AND rewrites .env
- [ ] Incoming call to the Twilio number reaches the target number
- [ ] `calls.log` receives entries (if server.js is running and STATUS_CALLBACK_URL is set)