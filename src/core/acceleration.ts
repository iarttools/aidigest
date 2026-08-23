export type AccelerationBackend = 'webgpu' | 'cpu';

export interface AccelerationInfo {
  backend: AccelerationBackend;
  available: boolean;
  vendor: string;
  architecture: string;
  device: string;
  reason: string;
}

export interface AccelerationProbe extends AccelerationInfo {
  probeOk: boolean;
  probeMs: number | null;
}

interface GpuAdapterLike {
  info?: { vendor?: string; architecture?: string; device?: string; description?: string };
  requestDevice?: () => Promise<unknown>;
}

interface GpuLike {
  requestAdapter?: () => Promise<GpuAdapterLike | null>;
}

function asNavigator(scope: unknown): { gpu?: GpuLike } | null {
  if (!scope || typeof scope !== 'object') return null;
  const candidate = scope as { navigator?: { gpu?: GpuLike } };
  return candidate.navigator ?? null;
}

function cpu(reason: string): AccelerationInfo {
  return { backend: 'cpu', available: false, vendor: 'n/a', architecture: 'n/a', device: 'CPU fallback', reason };
}

export async function detectAcceleration(scope: unknown = globalThis): Promise<AccelerationInfo> {
  const gpu = asNavigator(scope)?.gpu;
  if (!gpu?.requestAdapter) return cpu('WebGPU no está disponible en este entorno');
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return cpu('No se encontró un adaptador GPU compatible');
    if (adapter.requestDevice) await adapter.requestDevice();
    const info = adapter.info ?? {};
    return {
      backend: 'webgpu',
      available: true,
      vendor: info.vendor ?? 'unknown',
      architecture: info.architecture ?? 'unknown',
      device: info.device ?? info.description ?? 'WebGPU adapter',
      reason: 'Adaptador WebGPU disponible; el panel puede usar aceleración gráfica opcional',
    };
  } catch (error) {
    return cpu(`WebGPU rechazó el dispositivo: ${(error as Error).message}`);
  }
}

export async function probeAcceleration(scope: unknown = globalThis): Promise<AccelerationProbe> {
  const info = await detectAcceleration(scope);
  if (info.backend !== 'webgpu') return { ...info, probeOk: false, probeMs: null };
  const started = performance.now();
  try {
    const gpu = asNavigator(scope)?.gpu;
    const adapter = await gpu?.requestAdapter?.();
    const device = await adapter?.requestDevice?.() as { createShaderModule?: (descriptor: { code: string }) => unknown; createComputePipeline?: (descriptor: unknown) => unknown; createCommandEncoder?: () => { beginComputePass?: () => { setPipeline: (pipeline: unknown) => void; dispatchWorkgroups: (count: number) => void; end: () => void }; finish: () => unknown }; queue?: { submit: (commands: unknown[]) => void; onSubmittedWorkDone?: () => Promise<void> } };
    if (!device?.createShaderModule || !device.createComputePipeline || !device.createCommandEncoder || !device.queue) throw new Error('compute API no disponible');
    const module = device.createShaderModule({ code: '@compute @workgroup_size(1) fn main() {}' });
    const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass?.();
    if (!pass) throw new Error('compute pass no disponible');
    pass.setPipeline(pipeline);
    pass.dispatchWorkgroups(1);
    pass.end();
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone?.();
    return { ...info, probeOk: true, probeMs: Number((performance.now() - started).toFixed(2)) };
  } catch (error) {
    return { ...info, probeOk: false, probeMs: Number((performance.now() - started).toFixed(2)), reason: `WebGPU detectado pero el probe falló: ${(error as Error).message}` };
  }
}

