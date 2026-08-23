import { describe, expect, it } from 'vitest';
import { adaptTask, resolveTask } from './tasks.js';

describe('adaptive task engine', () => {
  it('keeps only the high-signal opening for direct answers', () => {
    const input = '# Title\n\nFirst useful paragraph.\n\nSecond useful paragraph.\n\nThird useful paragraph.\n\nFourth noisy paragraph.\n\n- Key fact';
    const output = adaptTask(input, 'answer');
    expect(output).toContain('First useful paragraph');
    expect(output).toContain('- Key fact');
    expect(output).not.toContain('Fourth noisy paragraph');
  });

  it('falls back safely for unknown task names', () => {
    expect(resolveTask('unknown').task).toBe('research');
  });
});

