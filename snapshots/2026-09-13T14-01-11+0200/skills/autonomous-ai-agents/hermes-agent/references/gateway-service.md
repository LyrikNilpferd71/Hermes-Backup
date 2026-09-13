# Gateway service install/start checklist

Session-tested notes for gateway lifecycle management.

## Basic flow

```bash
hermes gateway install
hermes gateway start
hermes gateway status
```

## Notes

- `install` creates/installs the background service; `start` only starts it.
- Prefer `status` after `start` to confirm the service is actually running.
- Gateway lifecycle commands are unrelated to browser automation or Chromium/CDP tooling.
- If a user asks for gateway install/start, do not substitute browser-harness or browser control commands.

## Troubleshooting

- If `start` appears to do nothing, check `hermes gateway status` and the gateway logs under `~/.hermes/logs/`.
- If the service is managed by systemd user units, service state may need a fresh login session or a user-service reset.
- On WSL/SSH environments, service lifetime can depend on host session behavior.

## Good follow-up checks

- `hermes gateway status`
- `tail -n 50 ~/.hermes/logs/gateway.log`
- `hermes doctor` if dependencies look suspect
