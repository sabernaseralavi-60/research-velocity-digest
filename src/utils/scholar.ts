/**
 * Generates an optimized direct Google Scholar URL for a research paper.
 * Includes sanitization for quotation wrapping, special characters, and HTML entities.
 */
export function generateScholarUrl(title: string, author?: string, year?: number): string {
  if (!title || !title.trim()) {
    return 'https://scholar.google.com';
  }

  // Clean title: remove HTML tags, extra whitespace, trailing periods or punctuation
  let cleanTitle = title
    .replace(/<[^>]+>/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[.,:;]+$/, '')
    .trim();

  // If title is exceptionally long (>200 chars), truncate slightly for query string limits
  if (cleanTitle.length > 200) {
    cleanTitle = cleanTitle.substring(0, 197) + '...';
  }

  // Exact phrase search by wrapping title in quotes
  const queryParam = `"${cleanTitle}"`;
  const url = new URL('https://scholar.google.com/scholar');
  url.searchParams.set('q', queryParam);

  if (year && year > 1900 && year <= 2030) {
    url.searchParams.set('as_ylo', String(year));
  }

  return url.toString();
}

/**
 * Reconstructs plain text from OpenAlex's abstract_inverted_index format.
 * OpenAlex stores abstracts as a map of words to integer position arrays:
 * { "deep": [0], "learning": [1], "models": [2] } -> "deep learning models"
 */
export function reconstructAbstract(invertedIndex?: Record<string, number[]> | null): string {
  if (!invertedIndex || typeof invertedIndex !== 'object') {
    return '';
  }

  const entries = Object.entries(invertedIndex);
  if (entries.length === 0) return '';

  const wordsWithPos: Array<{ word: string; pos: number }> = [];
  for (const [word, positions] of entries) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        wordsWithPos.push({ word, pos });
      }
    }
  }

  wordsWithPos.sort((a, b) => a.pos - b.pos);
  return wordsWithPos.map(item => item.word).join(' ');
}
