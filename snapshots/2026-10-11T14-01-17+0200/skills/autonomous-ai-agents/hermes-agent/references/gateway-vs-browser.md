# Gateway vs browser-harness

Session note: `hermes gateway install/start/status` are service lifecycle commands for Hermes' messaging gateway. They are *not* browser automation commands.

Observed pitfall:
- A user requested `hermes gateway install` and `hermes gateway start` immediately after browser setup work.
- The correct response is to treat those as separate domains:
  - Gateway → Hermes messaging service
  - browser-harness → Chromium/CDP browser control

Browser-harness connection recipe that worked in this environment:
- `chromium-browser` installed via apt
- Launch Chromium headless with remote debugging on `127.0.0.1:9222`
- Run browser-harness with `BU_CDP_URL=http://127.0.0.1:9222`
- Verify with `browser-harness -c 'print(page_info())'`

Important command-shape note:
- `browser-harness daemon start` was *not* a valid command in this install.
- The harness auto-starts on first `browser-harness -c ...` use, and `print(page_info())` is the simplest live check.

Keep this file concise; it is a durable reminder of the workflow boundary and the working local-CDP connection pattern.