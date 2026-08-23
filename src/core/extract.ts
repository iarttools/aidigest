import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { NodeHtmlMarkdown } from 'node-html-markdown';

export interface ExtractResult {
  title: string | null;
  markdown: string;
}

const nhm = new NodeHtmlMarkdown({ keepDataImages: false });

export function extract(html: string, url = 'https://example.com/'): ExtractResult {
  try {
    const { document } = parseHTML(html) as unknown as { document: Document };
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse() as { title?: string; content?: string } | null;
    if (!article || !article.content) return { title: null, markdown: '' };
    let md = nhm.translate(article.content);
    md = md.replace(/\n{3,}/g, '\n\n').trim();
    if (article.title) md = `# ${article.title}\n\n${md}`;
    return { title: article.title ?? null, markdown: md };
  } catch {
    return { title: null, markdown: '' };
  }
}

