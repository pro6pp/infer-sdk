/**
 * Supported ISO 3166-1 alpha-2 country codes.
 */
export type CountryCode = 'NL' | 'DE';

/**
 * The current step in the address inference process.
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
 * The standardized address object returned upon selection.
 */
export interface AddressValue {
  street: string;
  city: string;
  street_number?: string | number;
  house_number?: string | number;
  postcode?: string;
  postcode_full?: string;
  addition?: string;
  /** Allow for extra fields if API expands. */
  [key: string]: unknown;
}

/**
 * A single item in the dropdown list.
 */
export interface InferResult {
  /** The text to display in the UI (e.g. "Amsterdam"). */
  label: string;
  /** The actual address data. Only present if this result completes an address. */
  value?: AddressValue;
  /** Helper text. */
  subtitle?: string | null;
  /** Number of underlying results (optional). */
  count?: number | string;
}

/**
 * The complete state returned by the `useInfer` hook.
 */
export interface InferState {
  /** The current value of the input field. */
  query: string;
  /** The current inference stage. */
  stage: Stage | null;
  /** List of cities to display, specific to `mixed` mode. */
  cities: InferResult[];
  /** List of streets to display, specific to `mixed` mode. */
  streets: InferResult[];
  /** General suggestions to display. */
  suggestions: InferResult[];
  /** True if a full, valid address has been selected. */
  isValid: boolean;
  /** True if the last network request failed. */
  isError: boolean;
  /** True if a network request is currently active. */
  isLoading: boolean;
}

/**
 * Custom fetch implementation, compatible with `window.fetch`.
 * Useful for server-side usage or testing.
 */
export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Configuration for Infer Core.
 */
export interface InferConfig {
  /**
   * Pro6PP Authorization Key.
   */
  authKey: string;
  /**
   * Country to search addresses in.
   */
  country: CountryCode;
  /**
   * Base URL for the Pro6PP API.
   * Useful for proxying requests through your own backend.
   * @default 'https://api.pro6pp.nl/v2'
   */
  apiUrl?: string;

  /**
   * Custom fetch implementation.
   * Useful for server-side usage or testing.
   */
  fetcher?: Fetcher;
  /**
   * Maximum number of results to return.
   * @default 1000
   */
  limit?: number;
  /**
   * Callback fired when the internal state changes.
   */
  onStateChange?: (state: InferState) => void;
  /**
   * Callback fired when a user selects a full valid address.
   */
  onSelect?: (selection: AddressValue | string | null) => void;
}
