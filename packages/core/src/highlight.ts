import { HighlightSegment } from './types';

/**
 * Splits text into matched and unmatched segments based on a fuzzy query sequence.
 */
export function getHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!query || !text) return [{ text, match: false }];

  const segments: HighlightSegment[] = [];
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  let queryCursor = 0;
  let unmatchedCursor = 0;

  for (let textCursor = 0; textCursor < text.length; textCursor++) {
    const isMatch =
      queryCursor < query.length && normalizedText[textCursor] === normalizedQuery[queryCursor];

    if (!isMatch) continue;

    const hasPrecedingUnmatched = textCursor > unmatchedCursor;
    if (hasPrecedingUnmatched) {
      segments.push({ text: text.slice(unmatchedCursor, textCursor), match: false });
    }

    segments.push({ text: text[textCursor], match: true });

    queryCursor++;
    unmatchedCursor = textCursor + 1;
  }

  const hasRemainingText = unmatchedCursor < text.length;
  if (hasRemainingText) {
    segments.push({ text: text.slice(unmatchedCursor), match: false });
  }

  const isFullMatch = queryCursor === query.length;
  if (!isFullMatch) {
    return [{ text, match: false }];
  }

  return segments;
}
