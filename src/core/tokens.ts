import { getEncoding, type Tiktoken } from 'js-tiktoken';

let enc: Tiktoken | null = null;

function encoding(): Tiktoken {
  if (!enc) enc = getEncoding('cl100k_base');
  return enc;
}

export function countTokens(text: string): number {
  return encoding().encode(text).length;
}

