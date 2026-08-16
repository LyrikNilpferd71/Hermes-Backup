# ElevenLabs Webhook Payload Schemas

## Personalization Webhook (Call Start)

Sent by ElevenLabs when a call begins. The function returns `dynamic_variables` that the agent can reference in its prompts.

### Request

```json
{
  "caller_id": "string",
  "agent_id": "string",
  "called_number": "string",
  "call_sid": "string"
}
```

### Response

```json
{
  "dynamic_variables": {
    "priority_window": true,
    "priority_window_start": "11:00",
    "priority_window_end": "16:00",
    "timezone": "Europe/Berlin"
  }
}
```

## Post-Call Webhook (Call End)

Sent by ElevenLabs when a call ends. Writes to the call log database.

### Request

```json
{
  "call_sid": "string",
  "caller_number": "string",
  "started_at": "ISO8601",
  "duration_seconds": 123,
  "category": "string",
  "priority": false,
  "outcome": "string",
  "ticket_id": "string|null",
  "consent_given": false,
  "transcript": "string|null"
}
```

### Response

```json
{
  "success": true,
  "row_id": "uuid"
}
```

## Notes

- Personalization webhook must return within ~5 seconds or ElevenLabs times out
- Post-call webhook may retry on failure — ensure idempotency via `call_sid` dedup
- `consent_given` is a boolean from the agent's transcript — only set to true after explicit spoken consent
- The agent's opening line (EU AI Act disclosure) is NOT part of the webhook payload — it's configured in the agent's settings