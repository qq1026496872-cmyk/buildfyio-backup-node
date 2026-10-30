# Buildfyio backup node

VLESS + WebSocket node for Buildfyio (Hobby, no upgrade).

- The Node front listens on $PORT (injected by Buildfyio) on 0.0.0.0 and proxies WebSocket traffic to local Xray on 127.0.0.1:10001.
- Xray config is written to /tmp/xray/config.json because Buildfyio containers run with a read-only root filesystem.
- No credentials are stored in this repo. Set these in the Buildfyio dashboard as environment variables (marked secret):
  - UUID: a fresh VLESS UUID
  - WS_PATH: a WebSocket path, e.g. /<random>
  - PUBLIC_HOST: the project domain, e.g. <project>.buildfyio.com
  - NODE_NAME: optional display name
- Client link is built from PUBLIC_HOST, UUID, WS_PATH, port 443, TLS, WebSocket, host = PUBLIC_HOST.
- Ports: only 1024+ can be bound; Buildfyio terminates TLS at the edge and forwards 443 to $PORT.
