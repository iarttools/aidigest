import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../electron/panel.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../electron/panel.js', import.meta.url), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const usedKeys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]);
const staticIds = new Set(['langEs', 'langEn', 'topLangEs', 'topLangEn', 'chartRange', 'activityView', 'securityView', 'onboardingOverlay', 'onboardingTitle', 'demoResult', 'agentOverlay', 'agentTitle', 'trustOverlay', 'trustTitle', 'proofOverlay', 'proofTitle']);
const missingIds = ids.filter((id) => !js.includes(`$('${id}')`) && !staticIds.has(id));
const missingKeys = usedKeys.filter((key) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (js.match(new RegExp(`['"]${escaped}['"]`, 'g')) ?? []).length < 2;
});

if (missingIds.length || missingKeys.length) {
  console.error(JSON.stringify({ missingIds, missingKeys }, null, 2));
  process.exit(1);
}

console.log(`PANEL SMOKE OK · ${ids.length} ids · ${usedKeys.length} bilingual strings`);

