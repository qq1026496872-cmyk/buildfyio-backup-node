#!/bin/sh
set -e
: "${UUID:?UUID env var is required}"
: "${WS_PATH:?WS_PATH env var is required}"
# Buildfyio runs with a read-only root filesystem (except /tmp), so write Xray config to /tmp, not /usr/local/etc
mkdir -p /tmp/xray
sed -e "s|__UUID__|${UUID}|g" \
    -e "s|__WS_PATH__|${WS_PATH}|g" \
    /app/config.template.json > /tmp/xray/config.json
/usr/local/bin/xray run -config /tmp/xray/config.json &
XRAY_PID=$!
trap 'kill $XRAY_PID 2>/dev/null || true' TERM INT
node /app/server.js &
NODE_PID=$!
wait $NODE_PID
kill $XRAY_PID 2>/dev/null || true
