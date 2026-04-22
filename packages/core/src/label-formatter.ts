import { AddressValue } from './types';

/**
 * Address component types that can appear in user input.
 */
type ComponentType = 'street' | 'city' | 'street_number' | 'postcode' | 'addition';

/**
 * A detected component from the user's query.
 */
interface DetectedComponent {
  type: ComponentType;
  value: string;
  position: number;
}

/**
 * Normalizes a string for comparison (lowercase, trim).
 */
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds the position of a value in the query using word boundary matching.
 * This prevents "A" from matching inside "Damstraat".
 */
function findWordPosition(query: string, value: string): number {
  const normalizedQuery = normalize(query);
  const normalizedValue = normalize(value);

  // For multi-word values (like street names), just use indexOf
  if (normalizedValue.includes(' ')) {
    return normalizedQuery.indexOf(normalizedValue);
  }

  // For single-word/short values, use word boundary matching
  // Match at start of string, after comma/space, or at word boundary
  const pattern = new RegExp(`(?:^|[,\\s])${escapeRegex(normalizedValue)}(?:$|[,\\s])`, 'g');
  const match = pattern.exec(normalizedQuery);

  if (match) {
    // Return position of the actual value, not the delimiter
    const matchStart = match.index;
    const firstChar = normalizedQuery[matchStart];
    if (firstChar === ',' || firstChar === ' ') {
      return matchStart + 1;
    }
    return matchStart;
  }

  return -1;
}

/**
 * Detects which address components are present in the user's query
 * by matching against the structured address value.
 * Returns components in the order they appear in the query.
 */
function detectComponentOrder(query: string, value: AddressValue): DetectedComponent[] {
  const detected: DetectedComponent[] = [];

  // Order matters: longer/more specific values should be checked first
  const componentMap: { value: string; type: ComponentType }[] = [];

  if (value.street) {
    componentMap.push({ value: value.street, type: 'street' });
  }
  if (value.city) {
    componentMap.push({ value: value.city, type: 'city' });
  }
  if (value.postcode) {
    componentMap.push({ value: value.postcode, type: 'postcode' });
  }
  // Check street_number before addition (numbers are more common)
  if (value.street_number !== undefined && value.street_number !== null) {
    componentMap.push({ value: String(value.street_number), type: 'street_number' });
  }
  if (value.addition) {
    componentMap.push({ value: value.addition, type: 'addition' });
  }

  // Find each component in the query and record its position
  for (const comp of componentMap) {
    const position = findWordPosition(query, comp.value);

    if (position !== -1) {
      detected.push({
        type: comp.type,
        value: comp.value,
        position,
      });
    }
  }

  // Sort by position in query (user's typing order)
  detected.sort((a, b) => a.position - b.position);

  return detected;
}

/**
 * Formats a label for display based on the user's input order.
 * Components the user typed appear first (in their order),
 * followed by components they didn't type (new info from API).
 *
 * @param query The user's current query string
 * @param value The structured address value from the API
 * @returns A formatted label string
 */
export function formatLabelByInputOrder(query: string, value: AddressValue): string {
  if (!value || !query) {
    return '';
  }

  const detectedOrder = detectComponentOrder(query, value);
  const detectedTypes = new Set(detectedOrder.map((d) => d.type));

  const parts: string[] = [];

  // Add components in user's order
  for (const detected of detectedOrder) {
    parts.push(detected.value);
  }

  // Add remaining components (new info) in a default order
  const defaultOrder: ComponentType[] = ['street', 'street_number', 'addition', 'postcode', 'city'];

  for (const type of defaultOrder) {
    if (detectedTypes.has(type)) continue;

    let val: string | undefined;
    switch (type) {
      case 'street':
        val = value.street;
        break;
      case 'city':
        val = value.city;
        break;
      case 'street_number':
        val = value.street_number !== undefined ? String(value.street_number) : undefined;
        break;
      case 'postcode':
        val = value.postcode;
        break;
      case 'addition':
        val = value.addition;
        break;
    }

    if (val) {
      parts.push(val);
    }
  }

  return parts.join(', ');
}
