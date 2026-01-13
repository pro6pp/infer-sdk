/**
 * Supported ISO 3166-1 alpha-2 country codes.
 */
export type CountryCode = 'NL' | 'DE';

/**
 * The current step in the address inference process.
 * - `empty`: No input yet.
 * - `mixed`: User is prompted to choose between cities and streets.
 * - `street`: User is selecting a street.
 * - `city`: User is selecting a city.
 * - `postcode`: User is entering a postcode.
 * - `house_number`: User is entering a house number.
 * - `house_number_first`: Specialized mode where number is entered before street.
 * - `addition`: Selecting a house number addition (e.g., 'A', 'III').
 * - `direct`: Direct address hit (often via postcode).
 * - `final`: A complete, valid address has been identified.
 */
export type Stage =
  | 'empty'
  | 'mixed'
  | 'street'
  | 'city'
  | 'postcode'
  | 'house_number'
  | 'house_number_first'
  | 'addition'
  | 'direct'
  | 'final';

/**
 * The standardized address object returned upon a successful final selection.
 */
export interface AddressValue {
  /** The name of the street. */
  street: string;
  /** The name of the city/locality. */
  city: string;
  /** The house number. */
  house_number?: string | number;
  /** The postal code. */
  postcode?: string;
  /** The house number addition or suffix. */
  addition?: string;
  /** Allow for extra fields if API expands. */
  [key: string]: unknown;
}

/**
 * A single item in the suggestion list.
 */
export interface InferResult {
  /** The text to display in the UI (e.g. "Main Street"). */
  label: string;
  /** The actual address data.
   * Only present if this result completes an address or represents a specific entity.
   */
  value?: AddressValue | string;
  /** Secondary information (e.g., city name when suggesting a street). */
  subtitle?: string | null;
  /** Number of underlying results found for this suggestion. */
  count?: number | string;
}

/**
 * The complete UI state managed by InferCore.
 */
export interface InferState {
  /** The current text value of the search input. */
  query: string;
  /** The current logical stage of the address lookup. */
  stage: Stage | null;
  /** List of city suggestions (used in `mixed` stage). */
  cities: InferResult[];
  /** List of street suggestions (used in `mixed` stage). */
  streets: InferResult[];
  /** General list of suggestions for the current stage. */
  suggestions: InferResult[];
  /** Flag indicating if the current selection is a complete, valid address. */
  isValid: boolean;
  /** Flag indicating if the last API request failed. */
  isError: boolean;
  /** Flag indicating if a network request is currently in progress. */
  isLoading: boolean;
  /** Flag indicating if more results are available to load. */
  hasMore: boolean;
  /**
   * The index of the currently highlighted suggestion.
   * - `0` to `n`: An item is highlighted via keyboard navigation.
   * - `-1`: No item is highlighted.
   */
  selectedSuggestionIndex: number;
}

/**
 * Custom fetch implementation, compatible with the Web Fetch API.
 * Useful for Node.js environments or proxying requests.
 */
export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Configuration options for the Infer engine.
 */
export interface InferConfig {
  /**
   * Your Pro6PP Authorization Key.
   * Optional if using a proxy.
   */
  authKey?: string;
  /**
   * The country to perform address lookups in.
   */
  country: CountryCode;
  /**
   * * If provided, this URL is used as the API endpoint (query params will be appended).
   * * If not provided, the SDK defaults to 'https://api.pro6pp.nl/v2/infer/{country}'.
   */
  apiUrl?: string;

  /**
   * Custom fetch implementation for network requests.
   * @default window.fetch
   */
  fetcher?: Fetcher;
  /**
   * Number of suggestions to request per batch.
   * @default 20
   */
  limit?: number;
  /**
   * The delay in milliseconds before performing the API search.
   * Note: A lower bound of 50ms is enforced to protect API stability.
   * @default 150
   */
  debounceMs?: number;
  /**
   * Maximum number of retry attempts for transient network errors.
   * Valid range: 0 to 10.
   * @default 0
   */
  maxRetries?: number;
  /**
   * Callback triggered whenever the internal state (suggestions, loading status, etc.) updates.
   */
  onStateChange?: (state: InferState) => void;
  /**
   * Callback triggered when a user selects an item.
   * If the address is complete, returns an `AddressValue` object.
   * If the selection is partial, returns a `string`.
   */
  onSelect?: (selection: AddressValue | string | null) => void;
}

/**
 * Represents a segment of text that should be highlighted or left plain.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}
