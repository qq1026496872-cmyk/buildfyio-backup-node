'use strict';
const http = require('http');
const { execFile } = require('child_process');
const httpProxy = require('http-proxy');

const PORT = parseInt(process.env.PORT || '8080', 10);
const UUID = process.env.UUID || '';
const WS_PATH = process.env.WS_PATH || '/';
const SUB_TOKEN = process.env.SUB_TOKEN || '';
const TOTAL_GB = parseFloat(process.env.TOTAL_GB || '60');
const EXPIRE_EPOCH = parseInt(process.env.EXPIRE_EPOCH || '0', 10);
const NODE_NAME = process.env.NODE_NAME || 'Buildfyio-Backup';

function publicHost() {
  return process.env.BUILDFYIO_PUBLIC_DOMAIN || process.env.PUBLIC_HOST || process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost';
}

function vlessLink() {
  const host = publicHost();
  const params = new URLSearchParams({
    encryption: 'none',
    security: 'tls',
    sni: host,
    type: 'ws',
    host: host,
    path: WS_PATH,
  });
  return `vless://${UUID}@${host}:443?${params.toString()}#${encodeURIComponent(NODE_NAME)}`;
}

function queryStats(cb) {
  execFile('/usr/local/bin/xray', ['api', 'statsquery', '--server=127.0.0.1:10085', '-pattern', 'user>>>', '-reset=false'],
    { timeout: 4000 }, (err, stdout) => {
      if (err) return cb(0, 0);
      let up = 0, down = 0;
      try {
        const data = JSON.parse(stdout);
        for (const s of (data.stat || [])) {
          if (s.name && s.name.includes('>>>traffic>>>uplink')) up = Number(s.value || 0);
          if (s.name && s.name.includes('>>>traffic>>>downlink')) down = Number(s.value || 0);
        }
      } catch (e) { /* keep zeros */ }
      cb(up, down);
    });
}

const proxy = httpProxy.createProxyServer({ target: 'http://127.0.0.1:10001', ws: true });
proxy.on('error', (err, req, res) => {
  try {
    if (res && res.writeHead && !res.headersSent) { res.writeHead(502); res.end('bad gateway'); }
    else if (res && res.destroy) { res.destroy(); }
  } catch (e) { /* ignore */ }
});

const server = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0];

  if (SUB_TOKEN && url === `/sub/${SUB_TOKEN}`) {
    return queryStats((up, down) => {
      const total = Math.round(TOTAL_GB * 1024 * 1024 * 1024);
      const body = Buffer.from(vlessLink(), 'utf8').toString('base64');
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'subscription-userinfo': `upload=${up}; download=${down}; total=${total}; expire=${EXPIRE_EPOCH}`,
        'profile-update-interval': '24',
        'Content-Disposition': `attachment; filename="${NODE_NAME}"`,
      });
      res.end(body);
    });
  }

  if (url === WS_PATH) {
    return proxy.web(req, res);
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><html><head><title>Welcome</title></head><body><h1>It works!</h1></body></html>');
});

server.on('upgrade', (req, socket, head) => {
  const url = (req.url || '').split('?')[0];
  if (url === WS_PATH) {
    proxy.ws(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`front listening on ${PORT}, ws path ${WS_PATH}`));
