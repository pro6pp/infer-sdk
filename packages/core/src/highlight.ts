import { HighlightSegment } from './types';

/**
 * Merges consecutive segments with the same match status.
 */
function mergeSegments(segments: HighlightSegment[]): HighlightSegment[] {
  if (segments.length === 0) return segments;

  const merged: HighlightSegment[] = [];

  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.match === seg.match) {
      last.text += seg.text;
    } else {
      merged.push({ text: seg.text, match: seg.match });
    }
  }

  return merged;
}

/**
 * Splits text into matched and unmatched segments based on a fuzzy query sequence.
 * Consecutive matched characters are merged into single segments for cleaner rendering.
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

  return mergeSegments(segments);
}
