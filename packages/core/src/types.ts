/**
 * Supported ISO 3166-1 alpha-2 country codes.
 */
export type CountryCode =
  | 'NL'
  | 'DE'
  | 'BE'
  | 'AT'
  | 'DK'
  | 'CH'
  | 'LU'
  | 'FR'
  | 'ES'
  | 'GB'
  | (string & {});

/**
 * Supported language codes for address labels.
 */
export type LanguageCode = 'nl' | 'fr' | 'de' | (string & {});

/**
 * The ordering applied to mixed address and place suggestions.
 */
export type SortOrder = 'relevance' | 'distance';

/**
 * The kinds of suggestions requested from the Infer API.
 *
 * When omitted, the API keeps its address-only default.
 */
export type InferTypes = 'address' | 'place' | 'address,place';

/**
 * The current step in the address inference process.
 * - `empty`: No input yet.
 * - `mixed`: User is prompted to choose between cities and streets.
 * - `place`: User is selecting a point of interest.
 * - `street`: User is selecting a street.
 * - `city`: User is selecting a city.
 * - `postcode`: User is entering a postcode.
 * - `street_number`: User is entering a street number.
 * - `street_number_first`: Specialized mode where number is entered before street.
 * - `addition`: Selecting a street number addition (e.g., 'A', 'III').
 * - `direct`: Direct address hit (often via postcode).
 * - `final`: A complete, valid address has been identified.
 */
export type Stage =
  | 'empty'
  | 'mixed'
  | 'place'
  | 'street'
  | 'city'
  | 'postcode'
  | 'street_number'
  | 'street_number_first'
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
  /** Latitude of the address location. */
  lat?: number | null;
  /** Longitude of the address location. */
  lng?: number | null;
  /** The street number. */
  street_number?: string | number;
  /** The postal code. */
  postcode?: string;
  /** The street number addition or suffix. */
  addition?: string | null;
  /** Allow for extra fields if API expands. */
  [key: string]: unknown;
}

/**
 * A point of interest returned by the Infer API.
 */
export interface PlaceValue {
  /** Stable identifier of the place in the source dataset. */
  place_id: string;
  /** Display name of the place. */
  name: string;
  /** Primary place category. */
  category: string;
  /** Human-readable address, when available. */
  formatted_address: string | null;
  /** Address components, when available. */
  street: string | null;
  street_number: number | null;
  addition: string | null;
  postcode: string | null;
  city: string | null;
  /** Coordinates of the place. */
  lat: number;
  lng: number;
}

/** Shared display fields for a suggestion in the result list. */
interface InferResultBase {
  /** The text to display in the UI (e.g. "Main Street"). */
  label: string;
  /** Secondary information (e.g. city name when suggesting a street). */
  subtitle?: string | null;
  /** Number of underlying results found for this suggestion. */
  count?: number | string;
  /** False for close (fuzzy) matches that top up the exact matches. */
  exact?: boolean;
  /** The lowercase name the fuzzy pass matched, for close matches. */
  matched_value?: string | null;
  /** 0-based query positions that differ from the match, for close matches. */
  diff_positions?: number[] | null;
  /** Fuzzy-match metadata, when the API returns it. */
}

/** A regular address or partial-address suggestion. */
export interface AddressSuggestion extends InferResultBase {
  /** The actual address data, when this result completes an address. */
  value?: AddressValue | string;
  /** Address suggestions may omit this field, as in existing API responses. */
  type?: 'address';
}

/** A suggestion that represents a point of interest rather than an address. */
export interface PlaceSuggestion extends InferResultBase {
  type: 'place';
  value: PlaceValue;
}

/** A single item in the suggestion list. */
export type InferResult = AddressSuggestion | PlaceSuggestion;

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
  /** Place suggestions returned as a separate API partition, when provided. */
  places: PlaceSuggestion[];
  /** Flag indicating if the current selection is complete and valid. */
  isValid: boolean;
  /** The selected address value, otherwise null (places use `selectedPlace`). */
  value: AddressValue | null;
  /** The selected place object, otherwise null. */
  selectedPlace: PlaceValue | null;
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
   * Language code for response labels.
   * Affects the language of returned address labels.
   * Only applicable for BE country code.
   */
  language?: LanguageCode;
  /**
   * Sort mixed address and place suggestions by relevance or distance.
   * @default 'relevance'
   */
  sort?: SortOrder;
  /**
   * Latitude of the origin used for distance sorting.
   * When provided, `lng` must also be provided.
   */
  lat?: number;
  /**
   * Longitude of the origin used for distance sorting.
   * When provided, `lat` must also be provided.
   */
  lng?: number;
  /**
   * Suggestion types to request. Omit this to preserve the address-only default.
   */
  types?: InferTypes;
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
  /** Callback triggered when a point of interest is selected. */
  onPlaceSelect?: (selection: PlaceValue | null) => void;
}

/**
 * Represents a segment of text that should be highlighted or left plain.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}
