import { HighlightSegment } from './types';

interface FoldedText {
  folded: string;
  /**
   * `starts[i]`/`ends[i]` bound the original character that produced
   * `folded[i]`. A character NFKD can expand into several folded characters
   * (the `ĳ` ligature folds to `ij`), so a folded range [a, b) maps to the
   * original range [starts[a], ends[b - 1]), covering every original
   * character that contributed to the match, including partially matched
   * expansions.
   */
  starts: number[];
  ends: number[];
}

/**
 * Lowercases and strips decomposing accents, mirroring the API's
 * `normalize_search_text`, while keeping a map back to original indices.
 */
function fold(text: string): FoldedText {
  let folded = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;

  for (const char of text) {
    const stripped = char.toLowerCase().normalize('NFKD').replace(/\p{M}+/gu, '');
    for (const foldedChar of stripped) {
      folded += foldedChar;
      starts.push(index);
      ends.push(index + char.length);
    }
    index += char.length;
  }

  return { folded, starts, ends };
}

/**
 * Splits text into matched and unmatched segments for suggestion rendering.
 *
 * The API matches street and city names on any substring of the
 * accent-folded, lowercased name, so a contiguous occurrence of the folded
 * query is looked up first and highlighted as one segment: query `gebouw`
 * highlights the `gebouw` in `Klokgebouw`, and `bazille` highlights
 * `Bazillé` even though the query carries no accent.
 *
 * When the label does not contain the query verbatim (reordered multi-part
 * queries, fuzzy matches), it falls back to a greedy in-order walk over the
 * same folded text, placing each folded query character at its first
 * available position, so accents fold identically on both paths. If even
 * that fails to place every character, nothing is highlighted.
 */
export function getHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!query || !text) return [{ text, match: false }];

  const foldedText = fold(text);
  const foldedQuery = fold(query.trim()).folded;

  const start = foldedQuery ? foldedText.folded.indexOf(foldedQuery) : -1;
  if (start !== -1) {
    const from = foldedText.starts[start];
    const to = foldedText.ends[start + foldedQuery.length - 1];
    return [
      { text: text.slice(0, from), match: false },
      { text: text.slice(from, to), match: true },
      { text: text.slice(to), match: false },
    ].filter((seg) => seg.text.length > 0);
  }

  // Matched ranges over the original string. Folded characters expanded from
  // one source character share its range, so overlapping and adjacent ranges
  // merge as they are collected.
  const matchedRanges: Array<[number, number]> = [];
  let queryCursor = 0;

  for (
    let textCursor = 0;
    textCursor < foldedText.folded.length && queryCursor < foldedQuery.length;
    textCursor++
  ) {
    if (foldedText.folded[textCursor] !== foldedQuery[queryCursor]) continue;
    queryCursor++;

    const from = foldedText.starts[textCursor];
    const to = foldedText.ends[textCursor];
    const last = matchedRanges[matchedRanges.length - 1];
    if (last && from <= last[1]) {
      last[1] = Math.max(last[1], to);
    } else {
      matchedRanges.push([from, to]);
    }
  }

  const isFullMatch = queryCursor === foldedQuery.length;
  if (!isFullMatch) {
    return [{ text, match: false }];
  }

  return segmentsFromRanges(text, matchedRanges);
}

/**
 * Splits text into matched and unmatched segments for a close (fuzzy) match.
 *
 * A fuzzy suggestion need not contain the query, so this highlights the
 * longest common subsequence of the folded query and the folded label: the
 * characters the two share in order, wherever the typo moved them. Unplaced
 * query characters are expected and fine; a label sharing nothing with the
 * query renders unhighlighted.
 */
export function getFuzzyHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!query || !text) return [{ text, match: false }];

  const foldedText = fold(text);
  const foldedQuery = fold(query.trim()).folded;
  if (!foldedQuery) return [{ text, match: false }];

  // Classic LCS table; labels and queries are short, so the quadratic table
  // stays tiny.
  const textLength = foldedText.folded.length;
  const queryLength = foldedQuery.length;
  const lcs: number[][] = Array.from({ length: textLength + 1 }, () =>
    new Array(queryLength + 1).fill(0),
  );
  for (let i = textLength - 1; i >= 0; i--) {
    for (let j = queryLength - 1; j >= 0; j--) {
      lcs[i][j] =
        foldedText.folded[i] === foldedQuery[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const matchedRanges: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < textLength && j < queryLength) {
    if (foldedText.folded[i] === foldedQuery[j]) {
      const from = foldedText.starts[i];
      const to = foldedText.ends[i];
      const last = matchedRanges[matchedRanges.length - 1];
      if (last && from <= last[1]) {
        last[1] = Math.max(last[1], to);
      } else {
        matchedRanges.push([from, to]);
      }
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  if (matchedRanges.length === 0) {
    return [{ text, match: false }];
  }

  return segmentsFromRanges(text, matchedRanges);
}

function segmentsFromRanges(
  text: string,
  matchedRanges: Array<[number, number]>,
): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [from, to] of matchedRanges) {
    if (from > cursor) {
      segments.push({ text: text.slice(cursor, from), match: false });
    }
    segments.push({ text: text.slice(from, to), match: true });
    cursor = to;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false });
  }

  return segments;
}
