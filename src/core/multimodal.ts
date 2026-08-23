import { parseHTML } from 'linkedom';
import { extract } from './extract.js';

export interface ImageInfo {
  src: string;
  alt: string;
  caption?: string;
}

export interface MultimodalDigest {
  markdown: string;
  images: ImageInfo[];
  tables: number;
}

function abs(url: string | null, base: string): string {
  if (!url) return '';
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

export function multimodalDigest(html: string, baseUrl = '', describe?: (img: ImageInfo) => string): MultimodalDigest {
  const { document } = parseHTML(html) as unknown as { document: Document };
  const imgs: ImageInfo[] = [];
  for (const el of Array.from(document.querySelectorAll('img'))) {
    const src = abs(el.getAttribute('src'), baseUrl);
    const alt = el.getAttribute('alt') ?? '';
    const fig = el.closest('figure');
    const caption = fig?.querySelector('figcaption')?.textContent?.trim() || undefined;
    const info: ImageInfo = { src, alt, caption };
    if (describe) info.alt = describe(info);
    imgs.push(info);
  }
  const { markdown } = extract(html, baseUrl);
  return {
    markdown,
    images: imgs,
    tables: document.querySelectorAll('table').length,
  };
}

