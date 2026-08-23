'use strict';
// Hook opcional para que una IA Node envíe sus lecturas web a aidigest.
// El modo manual se respeta sin reiniciar ni editar este archivo.
// HTTP se destila; HTTPS se tuneliza sin MITM.
const { existsSync, readFileSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

function automaticEnabled() {
  if (process.env.AIDIGEST_MODE === 'manual') return false;
  if (process.env.AIDIGEST_MODE === 'automatic') return true;
  const file = process.env.AIDIGEST_CONFIG || join(homedir(), '.aidigest', 'config.json');
  if (!existsSync(file)) return true;
  try {
    return JSON.parse(readFileSync(file, 'utf8')).mode === 'automatic';
  } catch {
    return false;
  }
}

const proxy = process.env.AIDIGEST_PROXY_URL || 'http://127.0.0.1:8080';
const enabled = automaticEnabled();
if (enabled) {
  const { setGlobalDispatcher, ProxyAgent } = require('undici');
  setGlobalDispatcher(new ProxyAgent(proxy));
}

globalThis.__AIDIGEST_AGENT__ = { enabled, proxy };
module.exports = { enabled, proxy };

