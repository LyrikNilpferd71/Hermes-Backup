# Gateway install/start/status — session-tested notes

This session confirmed the practical flow for gateway lifecycle commands.

## Observed behavior

```bash
hermes gateway install
hermes gateway start
hermes gateway status
```

Observed output:

- `install` reported: `Service already installed at: /root/.config/systemd/user/hermes-gateway.service`
- `start` reported success: `✓ User service started`
- `status` showed the service as `active (running)`

## Useful takeaway

- The install step can be idempotent and may simply confirm an existing service.
- A successful `start` should still be followed by `status` to verify the service is actually running.
- If the user only wants the gateway up, the minimal reliable sequence is `install` → `start` → `status`.

## Notes from logs

- Telegram gateway logs in this session showed reconnect/time-out warnings while the service remained active.
- These warnings are operational noise unless the user reports an actual messaging failure; check `~/.hermes/logs/gateway.log` before taking broader action.
