const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const RESPONSE_TIMEOUT_MS = 30_000;

export interface TextFetchResult {
  response: Response;
  text: string;
}

export async function fetchText(url: string, init: RequestInit = {}): Promise<TextFetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL must be absolute');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('URL must use http or https');

  const response = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(RESPONSE_TIMEOUT_MS) });
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new Error('upstream response exceeds 10 MB');
  }
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error('upstream response exceeds 10 MB');
    return { response, text };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('upstream response exceeds 10 MB');
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { response, text: new TextDecoder().decode(bytes) };
}

