# Postiz Session — Instagram & TikTok Failure Diagnosis (Sep 22, 2026)

## Setup
- URL: `https://postiz.cleanminded.ai` (internal: `localhost:4007`)
- Docker containers: `postiz`, `postiz-postgres`, `postiz-redis`, `temporal`, etc.
- Config: `/opt/postiz/docker-compose.yaml`
- DB: `postgresql://postiz-user:***@postiz-postgres:5432/postiz-db-local`

## User Token
```
p9d160c925baa6916e00d9a65cf9cefdbf8f43f10a1f40d8bb596cd2933e59cd0
```

## Integrations
| id | name | providerIdentifier | refreshNeeded |
|---|---|---|---|
| cmubjqzhw0001sf7czmw232e5 | Cleanminded | instagram-standalone | f |
| cmubpyk6v0001p28ltgzztky2 | cleanminded | tiktok | f |

## Post History
| state | publishDate | integration |
|---|---|---|
| QUEUE | 2026-09-22 16:30 | tiktok |
| QUEUE | 2026-09-22 16:30 | tiktok |
| ERROR | 2026-09-22 16:30 | instagram |
| QUEUE | 2026-09-22 10:30 | tiktok |
| PUBLISHED | 2026-09-22 10:30 | instagram |
| QUEUE | 2026-09-22 10:30 | tiktok |
| ERROR | 2026-09-21 21:45 | tiktok |
| ERROR | 2026-09-21 21:24 | tiktok |
| PUBLISHED | 2026-09-21 21:24 | instagram |

## Key Error: Instagram "API access blocked"
```
ApplicationFailure: Unknown Error
  at InstagramProvider.fetch (social.abstract.ts:455)
  at InstagramProvider.postPending (instagram.provider.ts:725)
  at PostActivity.postSocialInternal (post.activity.ts:268)

→ Underlying API response:
{"error":{"message":"API access blocked.","type":"OAuthException","code":200}}
```

Instagram worked for 21:24 and 10:30 posts, then failed for 16:30. Token likely expired between posts.

## Key Error: TikTok "unaudited_client"
```
ApplicationFailure: App not approved for public posting, contact support
  at TiktokProvider.fetch (social.abstract.ts:455)
  at TiktokProvider.postPending (tiktok.provider.ts:816)

→ Underlying API response:
{"error":{"code":"unaudited_client_can_only_post_to_private_accounts"}}
```

## Key Error: TikTok "url_ownership_unverified"
```
ApplicationFailure: You have to upload the picture/video to Postiz when sending a URL
  at TiktokProvider.fetch (social.abstract.ts:455)
  at TiktokProvider.postPending (tiktok.provider.ts:816)

→ Underlying API response:
{"error":{"code":"url_ownership_unverified"}}

→ Post body used PULL_FROM_URL with 7 photos
```

## Docker-Compose API Config
- Instagram: App ID `1067520452652505`, Secret `9046f66f3eab933da45544631d0a9157`
- Facebook: App ID `1627217492524494`, Secret `011697f7b55df57da51438c0b1`
- TikTok: Client ID `sbawz8naf9ut1ghve3`, Secret `SOpFmUHSrzaxwwNG4VwbBWC4QE0J4bFo`