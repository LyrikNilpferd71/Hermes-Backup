#!/usr/bin/env node

/**
 * set-forward.js — Change Twilio forwarding target.
 *
 * Usage:  node twilio/set-forward.js +49123456789
 *
 * Updates both the TwiML Bin on Twilio AND the FORWARD_TO_NUMBER
 * value in the agent's .env. Uses a built-in .env parser (no deps).
 */

import twilio from 'twilio';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');

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

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error(`❌  No .env at ${ENV_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(ENV_PATH, 'utf-8');
  const parsed = parseDotenv(raw);
  const missing = [];
  for (const k of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']) {
    if (!parsed[k]) missing.push(k);
  }
  if (missing.length > 0) {
    console.error(`❌  Missing: ${missing.join(', ')}`);
    process.exit(1);
  }
  return { raw, parsed };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args[0]) { console.error('❌  Usage: node set-forward.js +49123456789'); process.exit(1); }
  const newTarget = args[0];
  if (!/^\+[1-9]\d{6,14}$/.test(newTarget)) {
    console.error(`❌  "${newTarget}" is not valid E.164`); process.exit(1);
  }

  const { raw, parsed } = loadEnv();
  const client = twilio(parsed.TWILIO_ACCOUNT_SID, parsed.TWILIO_AUTH_TOKEN);
  const phoneNumber = parsed.TWILIO_PHONE_NUMBER;
  const oldTarget = parsed.FORWARD_TO_NUMBER || '(none)';

  console.log(`📞  Phone: ${phoneNumber}  |  ${oldTarget} → ${newTarget}`);

  let binSid = null;
  for (const bin of (await client.twimlBins.list({ limit: 50 }))) {
    if (bin.friendlyName.startsWith('Call-Forward →')) { binSid = bin.sid; break; }
  }

  if (!binSid) {
    const b = await client.twimlBins.create({
      friendlyName: `Call-Forward → ${newTarget}`,
      twimlContent: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n    <Dial>${newTarget}</Dial>\n</Response>`,
    });
    binSid = b.sid;
    console.log(`✅  Created Bin: ${binSid}`);
  } else {
    await client.twimlBins(binSid).update({
      friendlyName: `Call-Forward → ${newTarget}`,
      twimlContent: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n    <Dial>${newTarget}</Dial>\n</Response>`,
    });
    console.log(`🔄  Updated Bin: ${binSid}`);
  }

  const voiceUrl = `https://handler.twilio.com/twiml/${binSid}`;
  await client.incomingPhoneNumbers(phoneNumber).update({ voiceUrl, voiceMethod: 'POST' });

  // Update .env
  const escapedOld = (parsed.FORWARD_TO_NUMBER || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^(FORWARD_TO_NUMBER=)${escapedOld}\\s*$`, 'm');
  const updated = regex.test(raw)
    ? raw.replace(regex, `$1${newTarget}`)
    : raw.replace(/^FORWARD_TO_NUMBER=.*$/m, `FORWARD_TO_NUMBER=${newTarget}`);
  writeFileSync(ENV_PATH, updated, 'utf-8');

  console.log(`✅  Done. ${oldTarget} → ${newTarget}`);
  console.log(`    Voice URL: ${voiceUrl}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });