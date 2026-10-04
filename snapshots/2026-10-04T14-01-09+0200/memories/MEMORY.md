On this Linux environment, `pip` is not installed in the Hermes venv; `uv tool install -e <path>` worked for installing browser-harness, and `browser-harness` is available on PATH afterward.
§
Twilio call forwarding is set up under /opt/hermes-2/twilio/ with setup.js, set-forward.js, server.js. Twilio SDK installed (npm). .env needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, FORWARD_TO_NUMBER filled in before node twilio/setup.js can run.
§
Postiz self-hosted at https://postiz.cleanminded.ai (port 4007, Docker). Config under /opt/postiz/. DB: postgres (postiz-postgres), user postiz-user. API token: p9d160c925baa6916e00d9a65cf9cefdbf8f43f10a1f40d8bb596cd2933e59cd0. Two integrations: Instagram (Cleanminded) + TikTok (cleanminded). TikTok not audited for public posting.