FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl unzip ca-certificates && XTAG=$(curl -fsSL https://api.github.com/repos/XTLS/Xray-core/releases/latest | grep -m1 '"tag_name"' | sed 's/.*: *//;s/"//g;s/,//') && if [ -z "$XTAG" ]; then XTAG="v25.9.12"; fi && curl -fsSL -o /tmp/xray.zip "https://github.com/XTLS/Xray-core/releases/download/${XTAG}/Xray-linux-64.zip" && unzip -o /tmp/xray.zip -d /tmp/xray-extract && install -m 755 /tmp/xray-extract/xray /usr/local/bin/xray && rm -rf /tmp/xray.zip /tmp/xray-extract && /usr/local/bin/xray version
COPY package.json /app/package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js /app/server.js
COPY config.template.json /app/config.template.json
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh /usr/local/bin/xray
ENTRYPOINT ["/entrypoint.sh"]
