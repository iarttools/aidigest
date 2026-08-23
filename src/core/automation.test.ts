import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAutomationConfig, isAutomatic, readAutomationConfig, writeAutomationConfig } from './automation.js';

describe('automatic/manual mode', () => {
  it('persists a reversible mode shared by all integrations', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'aidigest-automation-')), 'config.json');
    const automatic = createAutomationConfig({ mode: 'automatic', port: 8080, repo: 'https://github.com/example/aidigest', systemProxy: true });
    writeAutomationConfig(automatic, file);
    expect(isAutomatic(file)).toBe(true);
    expect(readAutomationConfig(file)?.proxyUrl).toBe('http://127.0.0.1:8080');
    const manual = createAutomationConfig({ mode: 'manual', port: 8080, systemProxy: false }, readAutomationConfig(file));
    writeAutomationConfig(manual, file);
    expect(isAutomatic(file)).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8')).mode).toBe('manual');
  });
});

