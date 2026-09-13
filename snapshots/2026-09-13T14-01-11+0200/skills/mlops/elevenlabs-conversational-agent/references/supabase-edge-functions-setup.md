# Supabase Edge Functions Deployment

## Prerequisites

- Node.js/npm (for `npm install -g supabase`)
- Supabase Personal Access Token (PAT) — create at `https://supabase.com/dashboard/account/tokens`
- Project reference (from dashboard URL: `https://supabase.com/dashboard/project/<ref>`)

## Login & Link

```bash
npm install -g supabase
supabase login --token sbp_<your-pat>
supabase link --project-ref <project-ref>
```

## Deploy SQL (RPC Functions)

Use the Management API to run raw SQL:

```bash
curl -X POST "https://api.supabase.com/v1/projects/<ref>/database/query" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE OR REPLACE FUNCTION ..."}'
```

## Deploy Edge Functions

Function files must be at `supabase/functions/<name>/index.ts` relative to the workdir:

```bash
mkdir -p supabase/functions/<name>
vim supabase/functions/<name>/index.ts
supabase functions deploy <name> --project-ref <ref>
```

## JWT Verification

Edge Functions default to `verify_jwt: true`. For webhooks called by external services (ElevenLabs, Twilio, etc.), disable it:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/<ref>/functions/<slug>" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt": false}'
```

## Secrets

### Auto-injected by Supabase Runtime
- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key

### Set manually
```bash
supabase secrets set KEY=VALUE --project-ref <ref>
```

### Pitfall
Do NOT set `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` via `supabase secrets set` — they have a reserved prefix and will be rejected. Use the auto-injected versions in your code.

## Session-Specific Commands

```bash
# Check deployed functions
curl -s "https://api.supabase.com/v1/projects/<ref>/functions" \
  -H "Authorization: Bearer <PAT>"

# Get function details
curl -s "https://api.supabase.com/v1/projects/<ref>/functions/<slug>" \
  -H "Authorization: Bearer <PAT>"
```