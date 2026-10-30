FROM ghcr.io/xtls/xray-core:latest AS xray

FROM node:22-alpine
WORKDIR /app
COPY --from=xray /usr/local/bin/xray /usr/local/bin/xray
COPY package.json /app/package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js /app/server.js
COPY config.template.json /app/config.template.json
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh /usr/local/bin/xray
ENTRYPOINT ["/entrypoint.sh"]
