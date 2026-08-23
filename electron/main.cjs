const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const { writeFileSync, mkdirSync, existsSync, readFileSync, copyFileSync, renameSync } = require('node:fs');
const { delimiter, dirname, join } = require('node:path');
const { dashboardSnapshot } = require('../release/dash-lib.cjs');
const { startAppProxy } = require('../release/app-proxy.cjs');
const { createAutomationConfig, readAutomationConfig, writeAutomationConfig, stopDetached } = require('../release/automation.cjs');
const { runDemo } = require('../release/demo.cjs');

if (process.argv.includes('--mcp')) {
  require('../release/mcp.bundle.cjs');
} else {
let mainWindow;
let proxyServer;
let proxyPort;
let tray;

function statsFile() {
  return process.env.AIDIGEST_STATS || join(app.getPath('home'), '.aidigest', 'stats.json');
}

ipcMain.handle('stats:snapshot', () => dashboardSnapshot(statsFile()));
ipcMain.handle('stats:reset', () => {
  const file = statsFile();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, '[]', 'utf8');
  return dashboardSnapshot(file);
});
ipcMain.handle('demo:run', () => runDemo());
ipcMain.handle('proxy:status', () => ({ on: Boolean(proxyServer), port: proxyPort ?? null }));
async function startEmbeddedProxy(port = 8080) {
  if (proxyServer) return { on: true, port: proxyPort };
  const server = startAppProxy({ port, task: 'research', autoStart: false });
  try {
    await new Promise((resolve, reject) => {
      const onListening = () => {
        server.off('error', onError);
        resolve();
      };
      const onError = (error) => {
        server.off('listening', onListening);
        reject(error);
      };
      server.once('listening', onListening);
      server.once('error', onError);
      server.listen(port, '127.0.0.1');
    });
    proxyServer = server;
    proxyPort = server.address().port;
  } catch (error) {
    if (server.listening) server.close();
    throw error;
  }
  return { on: true, port: proxyPort };
}

async function stopEmbeddedProxy() {
  if (proxyServer) await new Promise((resolve) => proxyServer.close(resolve));
  proxyServer = undefined;
  proxyPort = undefined;
  return { on: false, port: null };
}

ipcMain.handle('proxy:toggle', async (_event, desired) => {
  const shouldRun = desired === true;
  const result = !shouldRun ? await stopEmbeddedProxy() : await startEmbeddedProxy(8080);
  updateTray();
  return result;
});
ipcMain.handle('mode:status', () => readAutomationConfig() ?? { mode: 'manual', port: 8080, proxyUrl: 'http://127.0.0.1:8080', systemProxy: false, configFile: process.env.AIDIGEST_CONFIG || join(app.getPath('home'), '.aidigest', 'config.json') });
ipcMain.handle('mode:set', async (_event, desired) => {
  const mode = desired === 'automatic' ? 'automatic' : 'manual';
  const previous = readAutomationConfig();
  if (mode === 'manual') {
    stopDetached(previous?.servicePid);
    await stopEmbeddedProxy();
  }
  else {
    try { await startEmbeddedProxy(previous?.port ?? 8080); } catch { /* another automatic service may own the port */ }
  }
  const config = createAutomationConfig({ mode, port: previous?.port ?? 8080, repo: previous?.repo, systemProxy: previous?.systemProxy ?? false, servicePid: mode === 'automatic' ? previous?.servicePid : undefined }, previous);
  writeAutomationConfig(config);
  updateTray();
  return config;
});
function firstExisting(paths) {
  return paths.find((candidate) => candidate && existsSync(candidate));
}
function pathExecutable(names) {
  const suffixes = process.platform === 'win32' ? ['', '.exe', '.cmd'] : [''];
  const directories = (process.env.PATH || '').split(delimiter).filter(Boolean);
  for (const directory of directories) {
    for (const name of names) {
      for (const suffix of suffixes) {
        const candidate = join(directory, `${name}${suffix}`);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return undefined;
}
function appPaths(names) {
  const home = app.getPath('home');
  const appData = app.getPath('appData');
  const localAppData = process.env.LOCALAPPDATA;
  const programFiles = process.env.ProgramW6432 || process.env.ProgramFiles;
  const programFilesX86 = process.env['ProgramFiles(x86)'];
  const paths = [];
  const add = (root, ...parts) => { if (root) paths.push(join(root, ...parts)); };
  const entries = names.map((entry) => typeof entry === 'string' ? { directory: entry, executable: `${entry}.exe`, bundle: entry } : entry);
  if (process.platform === 'win32') {
    for (const entry of entries) {
      add(localAppData, 'Programs', entry.directory, entry.executable);
      add(localAppData, entry.directory, entry.executable);
      add(programFiles, entry.directory, entry.executable);
      add(programFilesX86, entry.directory, entry.executable);
    }
  } else if (process.platform === 'darwin') {
    for (const entry of entries) paths.push(join('/Applications', `${entry.bundle}.app`), join(home, 'Applications', `${entry.bundle}.app`));
  }
  return paths;
}
function agentCandidates() {
  const home = app.getPath('home');
  const appData = app.getPath('appData');
  const claudeConfig = process.platform === 'darwin'
    ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
    : join(appData, 'Claude', 'claude_desktop_config.json');
  const openCodeConfigs = process.platform === 'win32'
    ? [join(appData, 'opencode', 'opencode.json'), join(home, '.config', 'opencode', 'opencode.json')]
    : [join(home, '.config', 'opencode', 'opencode.json')];
  return [
    { id: 'claude', name: 'Claude Desktop', configPaths: [claudeConfig], appPaths: [...appPaths(['Claude', 'claude-desktop']), pathExecutable(['claude-desktop'])] },
    { id: 'cursor', name: 'Cursor', configPaths: [join(home, '.cursor', 'mcp.json')], appPaths: [...appPaths(['Cursor', 'cursor']), pathExecutable(['cursor'])] },
    { id: 'opencode', name: 'OpenCode', configPaths: openCodeConfigs, appPaths: [...appPaths(['OpenCode', 'opencode']), pathExecutable(['opencode'])] },
    { id: 'vscode', name: 'VS Code MCP', configPaths: [join(home, '.vscode', 'mcp.json')], appPaths: [...appPaths([{ directory: 'Microsoft VS Code', executable: 'Code.exe', bundle: 'Visual Studio Code' }, { directory: 'Visual Studio Code', executable: 'Code.exe', bundle: 'Visual Studio Code' }]), pathExecutable(['code'])] },
  ];
}
function agentCommand() {
  return app.isPackaged ? { command: process.execPath, args: ['--mcp'] } : { command: process.execPath, args: [join(__dirname, 'main.cjs'), '--mcp'] };
}
function agentConfig(id = 'claude') {
  const command = agentCommand();
  if (id === 'opencode') return { mcp: { aidigest: { type: 'local', command: [command.command, ...command.args], enabled: true } } };
  return { mcpServers: { aidigest: { ...command, description: 'Local web digest, token savings and context safety' } } };
}
function inspectAgent(candidate) {
  const configPath = firstExisting(candidate.configPaths) || candidate.configPaths[0];
  const executablePath = firstExisting(candidate.appPaths) || undefined;
  let configured = false;
  if (existsSync(configPath)) {
    try {
      const parsed = JSON.parse(readFileSync(configPath, 'utf8'));
      configured = candidate.id === 'opencode' ? Boolean(parsed?.mcp?.aidigest) : Boolean(parsed?.mcpServers?.aidigest);
    } catch { /* malformed or unsupported config is reported as not configured */ }
  }
  const detectedBy = [];
  if (executablePath) detectedBy.push('app');
  if (existsSync(configPath)) detectedBy.push('config');
  return { id: candidate.id, name: candidate.name, path: configPath, executablePath: executablePath || null, detected: detectedBy.length > 0, configured, detectedBy };
}
ipcMain.handle('agents:detect', () => agentCandidates().map(inspectAgent));
ipcMain.handle('agents:config', (_event, id) => {
  if (Array.isArray(id)) return Object.fromEntries(id.map((agentId) => [agentId, agentConfig(agentId)]));
  return agentConfig(typeof id === 'string' ? id : 'claude');
});
function configureAgentEntry(id) {
  const candidate = agentCandidates().find((item) => item.id === id);
  if (!candidate) return { id, ok: false, error: 'unknown agent configuration' };
  const configPath = firstExisting(candidate.configPaths) || candidate.configPaths[0];
  mkdirSync(dirname(configPath), { recursive: true });
  let parsed = {};
  if (existsSync(configPath)) {
    try { parsed = JSON.parse(readFileSync(configPath, 'utf8')); } catch { return { id, ok: false, path: configPath, error: `cannot parse ${configPath}; use Copy config instead` }; }
    copyFileSync(configPath, `${configPath}.aidigest-backup`);
  }
  const nextConfig = agentConfig(id);
  if (id === 'opencode') parsed.mcp = { ...(parsed.mcp || {}), ...nextConfig.mcp };
  else parsed.mcpServers = { ...(parsed.mcpServers || {}), ...nextConfig.mcpServers };
  const temporary = `${configPath}.tmp-${process.pid}`;
  writeFileSync(temporary, JSON.stringify(parsed, null, 2), 'utf8');
  renameSync(temporary, configPath);
  return { id, ok: true, path: configPath, backup: existsSync(`${configPath}.aidigest-backup`) ? `${configPath}.aidigest-backup` : null };
}
ipcMain.handle('agents:configure', (_event, ids) => {
  const selected = Array.isArray(ids) ? ids : [ids];
  const unique = [...new Set(selected.filter((id) => typeof id === 'string'))];
  if (!unique.length) throw new Error('select at least one agent');
  const results = unique.map((id) => configureAgentEntry(id));
  return { ok: results.every((result) => result.ok), results };
});
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:toggle-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.hide());
ipcMain.on('app:quit', () => app.quit());

function trayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="#f27a4b"/><path d="M3 5l3 3-3 3M8 11h5" fill="none" stroke="#20110b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}
function updateTray() {
  if (!tray) return;
  const config = readAutomationConfig();
  const automatic = config?.mode === 'automatic';
  tray.setToolTip(`aidigest · ${automatic ? 'AUTO' : 'MANUAL'}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'aidigest', enabled: false },
    { type: 'separator' },
    { label: 'Open panel', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: automatic ? 'Switch to manual' : 'Enable automatic', click: () => mainWindow?.webContents.send('tray:mode', automatic ? 'manual' : 'automatic') },
    { label: proxyServer ? 'Stop proxy' : 'Start proxy', click: async () => { try { if (proxyServer) await stopEmbeddedProxy(); else await startEmbeddedProxy(config?.port ?? 8080); updateTray(); } catch (error) { console.error('aidigest tray proxy:', error); } } },
    { type: 'separator' },
    { label: 'Quit aidigest', click: () => app.quit() },
  ]));
}
function createTray() {
  tray = new Tray(trayIcon());
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
  updateTray();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    title: 'aidigest · runtime',
    backgroundColor: '#050505',
    autoHideMenuBar: true,
    frame: false,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, 'preload.cjs'),
    },
  });

  const revealTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  }, 1500);
  mainWindow.loadFile(join(__dirname, 'panel.html')).catch((error) => {
    console.error('aidigest panel load failed:', error);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
  mainWindow.once('ready-to-show', () => {
    clearTimeout(revealTimer);
    mainWindow.show();
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`aidigest panel navigation failed (${errorCode}): ${errorDescription}`);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error(`aidigest panel renderer exited: ${details.reason}`);
  });
  mainWindow.on('closed', () => {
    if (proxyServer) proxyServer.close();
    mainWindow = undefined;
    proxyServer = undefined;
    proxyPort = undefined;
  });
}

app.whenReady().then(() => {
  const config = readAutomationConfig();
  if (config?.mode === 'automatic') {
    void startEmbeddedProxy(config.port).catch(() => { /* a CLI background service may already be listening */ });
  }
  createWindow();
  createTray();
});
app.on('window-all-closed', () => {
  // The tray keeps aidigest available without leaving a visible window.
});
app.on('before-quit', () => { tray?.destroy(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
}

