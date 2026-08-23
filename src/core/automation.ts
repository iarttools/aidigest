import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

export type OperationMode = 'automatic' | 'manual';

export interface AutomationConfig {
  version: 1;
  mode: OperationMode;
  port: number;
  proxyUrl: string;
  repo?: string;
  installedAt: string;
  updatedAt: string;
  servicePid?: number;
  systemProxy: boolean;
}

export function defaultAutomationFile(): string {
  return process.env.AIDIGEST_CONFIG ?? join(homedir(), '.aidigest', 'config.json');
}

export function readAutomationConfig(file = defaultAutomationFile()): AutomationConfig | null {
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<AutomationConfig>;
    const parsedPort = parsed.port;
    if (parsed.version !== 1 || (parsed.mode !== 'automatic' && parsed.mode !== 'manual') || typeof parsedPort !== 'number' || !Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) return null;
    return {
      version: 1,
      mode: parsed.mode,
      port: parsedPort,
      proxyUrl: typeof parsed.proxyUrl === 'string' ? parsed.proxyUrl : `http://127.0.0.1:${parsedPort}`,
      repo: typeof parsed.repo === 'string' ? parsed.repo : undefined,
      installedAt: typeof parsed.installedAt === 'string' ? parsed.installedAt : new Date(0).toISOString(),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
      servicePid: Number.isInteger(parsed.servicePid) && (parsed.servicePid ?? 0) > 0 ? parsed.servicePid : undefined,
      systemProxy: parsed.systemProxy === true,
    };
  } catch {
    return null;
  }
}

export function writeAutomationConfig(config: AutomationConfig, file = defaultAutomationFile()): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, JSON.stringify({ ...config, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  renameSync(temporary, file);
}

export function createAutomationConfig(options: { mode: OperationMode; port: number; repo?: string; systemProxy?: boolean; servicePid?: number }, previous?: AutomationConfig | null): AutomationConfig {
  const now = new Date().toISOString();
  return {
    version: 1,
    mode: options.mode,
    port: options.port,
    proxyUrl: `http://127.0.0.1:${options.port}`,
    repo: options.repo ?? previous?.repo,
    installedAt: previous?.installedAt ?? now,
    updatedAt: now,
    servicePid: options.servicePid,
    systemProxy: options.systemProxy ?? previous?.systemProxy ?? false,
  };
}

export function isAutomatic(file = defaultAutomationFile()): boolean {
  return readAutomationConfig(file)?.mode === 'automatic';
}

export function spawnDetached(command: string, args: string[], cwd?: string): number | undefined {
  const child = spawn(command, args, { cwd, detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  return child.pid;
}

export function stopDetached(pid: number | undefined): boolean {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid);
    return true;
  } catch {
    return false;
  }
}

