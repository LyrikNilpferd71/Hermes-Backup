#!/usr/bin/env node

/**
 * server.js — Twilio status callback logging server.
 *
 * Listens on PORT (default 3000) at /status (POST).
 * Logs each call event to calls.log.
 *
 * Usage:  node twilio/server.js
 *         PORT=8080 node twilio/server.js
 */

import { createServer } from 'http';
import { appendFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const LOG_PATH = resolve(__dirname, 'calls.log');

if (!existsSync(LOG_PATH)) appendFileSync(LOG_PATH, '', 'utf-8');

createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return void res.end(JSON.stringify({ status: 'ok', log: LOG_PATH }));
    }
    res.writeHead(404); return void res.end('POST /status only');
  }
  if (req.method !== 'POST' || req.url !== '/status') {
    res.writeHead(405); return void res.end('Method not allowed');
  }

  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const params = (req.headers['content-type'] || '').includes('application/json')
        ? JSON.parse(body)
        : Object.fromEntries(new URLSearchParams(body));

      const line = `[${new Date().toISOString()}] | CALL_SID=${params.CallSid || '-'} | CALLER=${params.Caller || params.From || '-'} | TO=${params.To || '-'} | STATUS=${params.CallStatus || '-'} | DURATION=${params.CallDuration || '-'}s | DIR=${params.Direction || '-'}\n`;
      appendFileSync(LOG_PATH, line, 'utf-8');
      console.log(line.trim());
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end('<?xml version="1.0" encoding="UTF-8"?><Response/>');
    } catch (e) {
      res.writeHead(400); res.end('Bad request');
    }
  });
}).listen(PORT, () => {
  console.log(`📋  Call logging: http://0.0.0.0:${PORT} → ${LOG_PATH}`);
});