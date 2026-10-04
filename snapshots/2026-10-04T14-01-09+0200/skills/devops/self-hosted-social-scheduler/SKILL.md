---
name: self-hosted-social-scheduler
description: "Postiz/self-hosted social: Docker+DB+API debugging."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux]
metadata:
  hermes:
    tags: [postiz, social-media, docker, postgresql, debugging, instagram, tiktok, oauth]
    related_skills: [systematic-debugging]
---

# Self-Hosted Social Scheduler Debugging

## Overview

Diagnose posting failures on self-hosted social media schedulers (Postiz, Buffer, etc.) that run in Docker with PostgreSQL. The canonical flow is:

1. **Confirm** the service is running and healthy  
2. **Inspect config** (docker-compose for API keys, tokens)  
3. **Check container logs** for upstream timeouts and social API errors  
4. **Query the DB directly** for post state, error messages, and integration status  
5. **Interpret social API error codes**  

Always do these **before** suggesting the user re-authenticate — the DB tells the real story.

---

## Step 1: Service Health

```bash
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}" | grep postiz
curl -s -o /dev/null -w "%{http_code}" http://localhost:4007
```

A 307 redirect is normal (SSR app). A 200 or 502 tells you backend status.

---

## Step 2: Configuration Inspection

```bash
read_file /opt/postiz/docker-compose.yaml
```

Key env vars: `MAIN_URL`, `FRONTEND_URL`, `INSTAGRAM_APP_ID/SECRET`, `TIKTOK_CLIENT_ID/SECRET`, `JWT_SECRET`, `NOT_SECURED`.

---

## Step 3: Container Logs

```bash
# Get recent errors (filter /api/mcp scanner noise)
docker logs --tail 100 postiz 2>&1 | grep -iv "upstream timed out" | grep -iE "error|fail|instagram|tiktok|facebook|oauth|token"
```

---

## Step 4: Database Introspection

### Connect

```bash
cat << 'SQL' | docker exec -i postiz-postgres sh -c 'psql -U postiz-user -d postiz-db-local'
-- SQL here
SQL
```

For multi-line queries, write a temp file inside the container to avoid shell quoting issues:

```bash
docker exec postiz-postgres sh -c "cat > /tmp/q.sql << 'SQL'
SELECT ... FROM \"Table\";
SQL
psql -U postiz-user -d postiz-db-local -f /tmp/q.sql"
```

### Discover columns first — Postiz uses **camelCase**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'Post' ORDER BY ordinal_position;
```

### Key Tables

**User:**
```sql
SELECT id, email, name, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
```

**Integration (connected social accounts):**
```sql
SELECT id, name, type, profile, "providerIdentifier", "refreshNeeded"
FROM "Integration" ORDER BY "createdAt" DESC;
```
- `providerIdentifier` = platform (`instagram-standalone`, `tiktok`, `facebook`, `x`)
- `refreshNeeded` = `true` means token expired, needs re-auth

**Post (scheduled/published/failed):**
```sql
SELECT id, title, state, "publishDate", "integrationId"
FROM "Post" ORDER BY "publishDate" DESC NULLS LAST LIMIT 20;
```
- `state`: `QUEUE` = scheduled, `PUBLISHED` = done, `ERROR` = failed, `DRAFT` = draft
- Join on `integrationId` to get platform

**Errors (JSON failure traces):**
```sql
SELECT id, message, "createdAt" FROM "Errors" ORDER BY "createdAt" DESC LIMIT 5;
```
The `message` column is a JSON blob from Temporal. Parse `details[0].json` for the actual API error payload.

### Cross-reference posts with platforms

```sql
SELECT p.id, p.title, p.state, p."publishDate", i."providerIdentifier"
FROM "Post" p
LEFT JOIN "Integration" i ON p."integrationId" = i.id
ORDER BY p."publishDate" DESC NULLS LAST;
```

---

## Step 5: Social API Error Patterns

### Instagram / Facebook — "API access blocked" (OAuthException code 200)

**Meaning:** Meta revoked/blocked the access token. Common causes:
- Token expired (60-day lifetime for Instagram)
- Password changed → all tokens invalidated
- App disconnected from Instagram Settings
- Instagram professional account status changed

**Fix:** Re-authenticate in Postiz UI (Integrations → Instagram → Disconnect & Reconnect).

**Quirk:** Earlier queued posts may show `PUBLISHED` while later ones fail — the token was valid when queued, then expired.

### TikTok — "App not approved for public posting"

**Error:** `unaudited_client_can_only_post_to_private_accounts`

**Meaning:** The TikTok developer app hasn't passed TikTok's audit. Unaudited apps can only post to private/self-view accounts.

**Fix:** Submit the app for review in TikTok Developer Portal. Not fixable in Postiz config.

### TikTok — "url_ownership_unverified"

**Error:** `PULL_FROM_URL` rejected by TikTok's API.

**Meaning:** TikTok does not support URL-based media transfer for unaudited apps. The image bytes must be uploaded directly.

**Fix:** Use DIRECT_POST instead of PULL_FROM_URL, or wait for TikTok app audit.

### Upstream Timeouts (Nginx → Backend)

**Log:** `upstream timed out (110: Connection timed out)`

**Meaning:** Node.js backend (port 3000) hung. Often from slow third-party API calls or DB query issues.

**Diagnosis:**
```bash
docker logs postiz 2>&1 | grep -v "upstream timed out" | grep -v "/api/mcp"
```

---

## Pitfalls

- **`column does not exist`:** Postiz uses camelCase. Always quote: `"createdAt"` not `created_at`. When piping through bash, heredoc with `'END'` (single-quoted delimiter) works.
- **Docker logs are noisy:** Scanners hit `/api/mcp`. Always filter them out.
- **Token ≠ App keys:** The `docker-compose.yaml` shows app Client ID/Secret, not user tokens. User tokens are in the DB `Integration.token`/`refreshToken`.
- **"Instagram worked for some posts, not others":** Token was valid when those were queued. Check error timestamps vs post creation times.
- **Psql inside docker exec:** `cat | docker exec -i postgres sh -c 'psql ...'` is reliable. For complex queries, write to a temp file first.