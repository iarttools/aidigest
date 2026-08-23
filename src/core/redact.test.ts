import { describe, expect, it } from 'vitest';
import { redactSensitive } from './redact.js';

describe('sensitive data redaction', () => {
  it('redacts credentials and personal data without touching surrounding text', () => {
    const result = redactSensitive('Contact ana@example.com. Key sk-abcdefghijklmnopqrstuvwxyz123456 and token eyJabc.def.ghi');
    expect(result.total).toBe(3);
    expect(result.text).toContain('[REDACTED_EMAIL]');
    expect(result.text).toContain('[REDACTED_API_KEY]');
    expect(result.text).toContain('[REDACTED_JWT]');
  });
});

