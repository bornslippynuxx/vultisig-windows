#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function logWithTimestamp(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${level}] ${timestamp}`;
  
  if (data) {
    console.log(`${prefix} - ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} - ${message}`);
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle logging endpoint
  if (pathname === '/log' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const logData = JSON.parse(body);
        logWithTimestamp(logData.level, logData.message.replace(/^\[[^\]]+\] [^-]+ - /, ''), logData.data);
      } catch (e) {
        console.error('Failed to parse log data:', body);
      }
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end('{"status":"ok"}');
    });
    return;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Serve static files
  let filePath;
  if (pathname === '/' || pathname === '/examples/web-app/') {
    filePath = path.join(__dirname, 'index.html');
  } else if (pathname.startsWith('/dist/')) {
    // Serve from SDK dist folder
    filePath = path.join(__dirname, '../../dist', pathname.replace('/dist/', ''));
  } else if (pathname.startsWith('/wallet-core/')) {
    // Serve wallet-core files from dist directory
    const walletCorePath = pathname.replace('/wallet-core/', '');
    filePath = path.join(__dirname, '../../../../node_modules/@trustwallet/wallet-core/dist', walletCorePath);
  } else if (pathname.startsWith('/node_modules/')) {
    // Serve node_modules files
    filePath = path.join(__dirname, '../../../..', pathname);
  } else {
    filePath = path.join(__dirname, pathname);
  }
  
  // Security check
  const webAppDir = __dirname;
  const sdkDir = path.join(__dirname, '../..');
  const walletCoreDir = path.join(__dirname, '../../../../node_modules/@trustwallet/wallet-core/dist');
  const nodeModulesDir = path.join(__dirname, '../../../..');
  if (!filePath.startsWith(webAppDir) && 
      !filePath.startsWith(path.join(sdkDir, 'dist')) && 
      !filePath.startsWith(walletCoreDir) &&
      !filePath.startsWith(nodeModulesDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, {
          'Access-Control-Allow-Origin': '*'
        });
        res.end('File not found');
        console.log(`404 - ${pathname}`);
      } else {
        res.writeHead(500, {
          'Access-Control-Allow-Origin': '*'
        });
        res.end('Server error');
        console.error(`500 - ${pathname}:`, err.message);
      }
    } else {
      const mimeType = getMimeType(filePath);
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
      console.log(`200 - ${pathname} (${mimeType})`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Vultisig SDK Dev Server running at http://localhost:${PORT}`);
  console.log(`📱 Web App: http://localhost:${PORT}/`);
  console.log(`📋 Logs will appear below:`);
  console.log('─'.repeat(60));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the existing process and try again.`);
    console.error(`   Try: lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
