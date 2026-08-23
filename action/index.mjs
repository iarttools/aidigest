import fs from 'node:fs';
import { collectReceipt } from './metrics.mjs';

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const paths = process.env.INPUT_PATHS || 'README.md,docs';
const shouldComment = !['false', '0', 'no'].includes((process.env.INPUT_COMMENT || 'true').toLowerCase());
const failOnReduction = ['true', '1', 'yes'].includes((process.env.INPUT_FAIL_ON_REDUCTION || 'false').toLowerCase());
const receipt = collectReceipt(root, paths);

function writeOutputs(values) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  fs.appendFileSync(outputFile, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
}

function markdown() {
  const signals = receipt.injectionSignals.length
    ? `⚠️ ${receipt.injectionSignals.length} possible instruction signal(s) flagged for review`
    : '✅ No known instruction signals found by this lightweight scan';
  const files = receipt.files.length ? receipt.files.map((file) => `\`${file.path}\``).join(', ') : 'no matching text files';
  return `<!-- aidigest-context-receipt -->
## aidigest context receipt

This is a local, approximate measurement of the selected repository context. It does not call an AI model or send files to a hosted service.

| Signal | Result |
| --- | ---: |
| Files inspected | ${receipt.files.length} |
| Estimated input tokens | ${receipt.rawTokens.toLocaleString()} |
| Estimated useful tokens | ${receipt.usefulTokens.toLocaleString()} |
| Estimated removable context | **${receipt.savedTokens.toLocaleString()} (${receipt.savingsPct}%)** |
| Lines of repeated/boilerplate noise | ${receipt.removedLines} |

${signals}

Inspected: ${files}. Treat the percentage as a decision aid, not a guarantee for every page or model.`;
}

async function githubRequest(url, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const response = await fetch(`${process.env.GITHUB_API_URL || 'https://api.github.com'}${url}`, {
    ...options,
    headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

async function publishComment() {
  if (!shouldComment || !process.env.GITHUB_REPOSITORY || !process.env.GITHUB_EVENT_PATH) return;
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const number = event.pull_request?.number;
  if (!number) return;
  const body = markdown();
  const comments = await githubRequest(`/repos/${process.env.GITHUB_REPOSITORY}/issues/${number}/comments?per_page=100`);
  const existing = Array.isArray(comments) ? comments.find((comment) => comment.body?.includes('<!-- aidigest-context-receipt -->')) : null;
  if (existing) await githubRequest(`/repos/${process.env.GITHUB_REPOSITORY}/issues/comments/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ body }), headers: { 'content-type': 'application/json' } });
  else await githubRequest(`/repos/${process.env.GITHUB_REPOSITORY}/issues/${number}/comments`, { method: 'POST', body: JSON.stringify({ body }), headers: { 'content-type': 'application/json' } });
}

writeOutputs({ files: receipt.files.length, raw_tokens: receipt.rawTokens, useful_tokens: receipt.usefulTokens, saved_tokens: receipt.savedTokens, savings_pct: receipt.savingsPct, injection_signals: receipt.injectionSignals.length });
console.log(markdown());
try {
  await publishComment();
} catch (error) {
  console.warn(`aidigest could not update the pull request comment: ${error.message}`);
}
if (failOnReduction && receipt.savedTokens === 0) process.exitCode = 1;

