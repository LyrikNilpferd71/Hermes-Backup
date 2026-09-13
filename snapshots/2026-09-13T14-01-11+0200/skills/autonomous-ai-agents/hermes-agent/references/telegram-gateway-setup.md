# Telegram gateway setup notes

Session-tested workflow for configuring Telegram with `hermes gateway setup`.

## What worked
1. Run `hermes gateway setup`.
2. Select `Telegram` from the platform list.
3. Enter the bot token from @BotFather when prompted.
4. Leave Allowed user IDs empty only if you intentionally want open access; otherwise enter a comma-separated numeric allowlist.
5. Optionally set a Telegram home channel if you want a non-DM target.
6. Accept service installation when prompted.
7. Prefer the user systemd service for local/dev machines; it can be started without sudo.
8. Enable linger if you want the gateway to survive logout.
9. Start the service and verify with `hermes gateway status`.

## Useful checks
- `hermes gateway status` should show the service as active/running.
- If no allowlist is configured, the gateway log warns that unauthorized users will be denied by default.
- Telegram config is driven by env vars like `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`, and `TELEGRAM_HOME_CHANNEL`.

## Pitfalls
- Treat pasted bot tokens as secrets; rotate the token if it was exposed in chat or logs.
- The setup wizard is interactive and may re-display the platform list after a skipped section; continue with the next prompt rather than restarting.
- User service install may mention lingering; that is expected on dev boxes and is safe to accept when appropriate.
- If the gateway is already configured, the setup flow may preserve the current state unless explicitly changed.
