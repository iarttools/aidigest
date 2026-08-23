import { describe, expect, it } from 'vitest';
import { detectAcceleration, probeAcceleration } from './acceleration.js';

describe('acceleration fallback', () => {
  it('reports CPU when WebGPU is not exposed', async () => {
    const info = await detectAcceleration({});
    const probe = await probeAcceleration({});
    expect(info.backend).toBe('cpu');
    expect(probe.probeOk).toBe(false);
  });

  it('runs the compute probe when a WebGPU adapter is available', async () => {
    const device = {
      createShaderModule: () => ({}),
      createComputePipeline: () => ({}),
      createCommandEncoder: () => ({
        beginComputePass: () => ({ setPipeline: () => undefined, dispatchWorkgroups: () => undefined, end: () => undefined }),
        finish: () => ({}),
      }),
      queue: { submit: () => undefined, onSubmittedWorkDone: async () => undefined },
    };
    const scope = { navigator: { gpu: { requestAdapter: async () => ({ info: { vendor: 'test', device: 'mock' }, requestDevice: async () => device }) } } };
    const result = await probeAcceleration(scope);
    expect(result.backend).toBe('webgpu');
    expect(result.probeOk).toBe(true);
    expect(result.probeMs).not.toBeNull();
  });
});

