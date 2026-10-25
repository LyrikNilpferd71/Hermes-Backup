# Twilio API Reference — Call Forwarding

Reference for the specific Twilio API endpoints and payload shapes used in the call forwarding pattern.

## TwiML Bins API

### List all TwiML Bins

```js
const bins = await client.twimlBins.list({ limit: 50 });
// Each bin: { sid, friendlyName, twimlContent, accountSid, ... }
```

### Create a TwiML Bin

```js
const bin = await client.twimlBins.create({
  friendlyName: 'Call-Forward → +49123456789',
  twimlContent: `<?xml version="1.0"?>
<Response>
  <Dial>+49123456789</Dial>
</Response>`,
});
// bin.sid → "EHxxxx..."
```

### Update a TwiML Bin

```js
await client.twimlBins(binSid).update({
  friendlyName: 'Call-Forward → +4930123456',
  twimlContent: `<?xml version="1.0"?>
<Response>
  <Dial>+4930123456</Dial>
</Response>`,
});
```

**Note:** The SDK v5 uses `client.twimlBins(binSid).update()` — not `.update()` on the list result. Make sure you call `.update()` on the resource, not the collection.

## Phone Number Configuration

### Get incoming phone number by E.164

```js
// Pass the E.164 string directly — Twilio resolves it
const numbers = await client.incomingPhoneNumbers.list({ phoneNumber: '+15054728799' });
const number = numbers[0];
// number.sid → "PNxxxx..."
```

### Update Voice URL

```js
await client.incomingPhoneNumbers('+15054728799').update({
  voiceUrl: 'https://handler.twilio.com/twiml/EHxxxx',
  voiceMethod: 'POST',
  statusCallback: 'https://your-server.com/status',  // optional
  statusCallbackMethod: 'POST',
});
```

### Important: SID vs E.164

The `incomingPhoneNumbers` resource accepts **either** the phone number's SID (`PNxxx`) or the full E.164 string. Both work. Using the E.164 string is more readable in scripts; using the SID is slightly faster (no lookup).

## Status Callback Payload

Twilio sends form-encoded POST data to the status callback URL. Key fields:

| Field | Example | Notes |
|---|---|---|
| `CallSid` | `CA123abc...` | Unique call identifier |
| `From` | `+15055551234` | Caller's number |
| `To` | `+15054728799` | Your Twilio number |
| `CallStatus` | `completed` | `initiated`, `ringing`, `in-progress`, `completed`, `busy`, `failed`, `no-answer` |
| `CallDuration` | `42` | Seconds, only on `completed` |
| `Direction` | `inbound` | `inbound` or `outbound-dial` |
| `Called` | `+15054728799` | Same as To |
| `Caller` | `+15055551234` | Same as From |
| `AccountSid` | `ACxxx` | Your account |

Multiple callbacks fire per call — one for each status transition. The `completed` status with `CallDuration` is the one to log for duration.

## E.164 Format

- Country code prefix: `+` followed by 1-3 digits
- National number: subscriber number without trunk prefix
- Total length: 7-15 digits including `+`

Examples:
- US: `+15054728799` (country code `1`, area code `505`)
- Germany: `+491512345678` (country code `49`, mobile)
- UK: `+442079460123` (country code `44`, London landline)

Validation regex:
```js
/^\+[1-9]\d{6,14}$/
```

## TwiML `<Dial>` Variations

### Simple forward (no caller ID display)

```xml
<Response>
    <Dial>+49123456789</Dial>
</Response>
```

### Forward with caller ID set to Twilio number

```xml
<Response>
    <Dial callerId="+15054728799">+49123456789</Dial>
</Response>
```

### Forward with per-call status callback

```xml
<Response>
    <Dial action="/status" method="POST">+49123456789</Dial>
</Response>
```

## Testing

### Check current phone number config via API

```js
const num = await client.incomingPhoneNumbers('+15054728799').fetch();
console.log(num.voiceUrl);   // should point to handler.twilio.com/twiml/EHxxx
console.log(num.voiceMethod); // POST
```

### Manual test

Call the Twilio number from any phone. If forwarding is working, the call should ring at the target number.

## Common errors

| Error | Likely cause |
|---|---|
| `Unable to create record: Cannot parse TwiML` | Malformed XML in TwiML Bin content |
| `Account not authorized to use TwiML Bins` | Account needs TwiML Bins enabled (usually on by default) |
| `The requested resource /twiml/... was not found` | Bin SID is wrong or belonged to a different account |
| `Caller ID not verified` | The `<Dial callerId>` number must be verified (Twilio Console → Verified Caller IDs) or be a Twilio number you own |