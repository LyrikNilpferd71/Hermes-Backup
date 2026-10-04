#!/usr/bin/env node

/**
 * setup.js — Twilio call forwarding setup (inside Hermes-2).
 *
 * Usage:  node twilio/setup.js
 *
 * Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
 * FORWARD_TO_NUMBER from the agent's .env (parent directory).
 *
 * Creates/updates a TwiML Bin that <Dial>s FORWARD_TO_NUMBER
 * and assigns it as the Voice URL for the phone number.
 */

import twilio from 'twilio';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const HERMES_HOME = resolve(__dirname, '..');

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
  for (const k of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'FORWARD_TO_NUMBER']) {
    if (!parsed[k]) missing.push(k);
  }
  if (missing.length > 0) {
    console.error(`❌  Missing: ${missing.join(', ')}`);
    process.exit(1);
  }
  return parsed;
}

function buildTwiML(target) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>${target}</Dial>
</Response>`;
}

async function main() {
  const env = loadEnv();
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  const phoneNumber = env.TWILIO_PHONE_NUMBER;
  const target = env.FORWARD_TO_NUMBER;

  console.log(`📞  Phone: ${phoneNumber}  →  ${target}`);

  // Find or create TwiML Bin
  let binSid = null;
  for (const bin of (await client.twimlBins.list({ limit: 50 }))) {
    if (bin.friendlyName.startsWith('Call-Forward →')) { binSid = bin.sid; break; }
  }

  if (binSid) {
    await client.twimlBins(binSid).update({
      friendlyName: `Call-Forward → ${target}`,
      twimlContent: buildTwiML(target),
    });
    console.log(`🔄  Updated Bin: ${binSid}`);
  } else {
    const b = await client.twimlBins.create({
      friendlyName: `Call-Forward → ${target}`,
      twimlContent: buildTwiML(target),
    });
    binSid = b.sid;
    console.log(`✅  Created Bin: ${binSid}`);
  }

  const voiceUrl = `https://handler.twilio.com/twiml/${binSid}`;
  await client.incomingPhoneNumbers(phoneNumber).update({ voiceUrl, voiceMethod: 'POST' });

  writeFileSync(resolve(HERMES_HOME, 'twilio', '.last-bin-sid'), binSid + '\n', 'utf-8');
  console.log(`✅  Voice URL: ${voiceUrl}`);
  console.log(`    Change: node twilio/set-forward.js +49XXXXXXXXXX`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });