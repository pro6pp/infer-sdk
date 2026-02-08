import { InferConfig, InferState, InferResult, Fetcher, AddressValue, CountryCode } from './types';
import { formatLabelByInputOrder } from './label-formatter';

const DEFAULTS = {
  API_URL: 'https://api.pro6pp.nl/v2',
  LIMIT: 20,
  DEBOUNCE_MS: 150,
  MIN_DEBOUNCE_MS: 50,
  MAX_RETRIES: 0,
};

const PATTERNS = {
  DIGITS_1_3: /^[0-9]{1,3}$/,
  STREET_NUMBER_PREFIX: /^(\d+)\s*,\s*$/,
};

/**
 * The initial state of the address inference engine.
 */
export const INITIAL_STATE: InferState = {
  query: '',
  stage: null,
  cities: [],
  streets: [],
  suggestions: [],
  isValid: false,
  value: null,
  isError: false,
  isLoading: false,
  hasMore: false,
  selectedSuggestionIndex: -1,
};

type DebouncedFunction<T extends (...args: any[]) => void> = ((...args: Parameters<T>) => void) & {
  cancel: () => void;
};

/**
 * The core logic engine for Pro6PP Infer.
 * Manages API communication, state transitions, and keyboard interaction logic.
 */
export class InferCore {
  private country: CountryCode;
  private authKey?: string;
  private explicitApiUrl?: string;
  private baseLimit: number;
  private currentLimit: number;
  private maxRetries: number;
  private fetcher: Fetcher;
  private onStateChange: (state: InferState) => void;
  private onSelect: (selection: AddressValue | string | null) => void;
  /**
   * The current read-only state of the engine.
   * Use `onStateChange` to react to updates.
   */
  public state: InferState;
  private abortController: AbortController | null = null;
  private debouncedFetch: DebouncedFunction<(val: string) => void>;

  /**
   * Initializes a new instance of the Infer engine.
   * @param config The configuration object including API keys and callbacks.
   */
  constructor(config: InferConfig) {
    this.country = config.country;
    this.authKey = config.authKey;
    this.explicitApiUrl = config.apiUrl;
    this.baseLimit = config.limit || DEFAULTS.LIMIT;
    this.currentLimit = this.baseLimit;

    const configRetries =
      config.maxRetries !== undefined ? config.maxRetries : DEFAULTS.MAX_RETRIES;
    this.maxRetries = Math.max(0, Math.min(configRetries, 10));

    this.fetcher = config.fetcher || ((url, init) => fetch(url, init));
    this.onStateChange = config.onStateChange || (() => {});
    this.onSelect = config.onSelect || (() => {});
    this.state = { ...INITIAL_STATE };

    const configDebounce =
      config.debounceMs !== undefined ? config.debounceMs : DEFAULTS.DEBOUNCE_MS;
    const debounceTime = Math.max(configDebounce, DEFAULTS.MIN_DEBOUNCE_MS);

    this.debouncedFetch = this.debounce((val: string) => this.executeFetch(val), debounceTime);
  }

  /**
   * Processes new text input from the user.
   * Triggers a debounced API request and updates the internal state.
   * @param value The raw string from the input field.
   */
  public handleInput(value: string): void {
    this.currentLimit = this.baseLimit;

    const isEditingFinal = this.state.stage === 'final' && value !== this.state.query;

    this.updateState({
      query: value,
      isValid: false,
      value: null,
      isLoading: !!value.trim(),
      selectedSuggestionIndex: -1,
      hasMore: false,
      stage: isEditingFinal ? null : this.state.stage,
    });

    if (isEditingFinal) {
      this.onSelect(null);
    }

    this.debouncedFetch(value);
  }

  /**
   * Increases the current limit and re-fetches the query to show more results.
   */
  public loadMore(): void {
    if (this.state.isLoading) return;
    this.currentLimit += this.baseLimit;
    this.updateState({ isLoading: true });
    this.executeFetch(this.state.query);
  }

  /**
   * Handles keyboard events for the input field.
   * Supports:
   * - `ArrowUp`/`ArrowDown`: Navigate through the suggestion list.
   * - `Enter`: Select the currently highlighted suggestion.
   * - `Space`: Automatically inserts a comma if a numeric street number is detected.
   * @param event The keyboard event from the input element.
   */
  public handleKeyDown(
    event: KeyboardEvent | { key: string; target: EventTarget | null; preventDefault: () => void },
  ): void {
    const target = event.target as HTMLInputElement;
    if (!target) return;

    const totalItems =
      this.state.cities.length + this.state.streets.length + this.state.suggestions.length;

    if (totalItems > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        let nextIndex = this.state.selectedSuggestionIndex + 1;
        if (nextIndex >= totalItems) {
          nextIndex = 0;
        }
        this.updateState({ selectedSuggestionIndex: nextIndex });
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        let nextIndex = this.state.selectedSuggestionIndex - 1;
        if (nextIndex < 0) {
          nextIndex = totalItems - 1;
        }
        this.updateState({ selectedSuggestionIndex: nextIndex });
        return;
      }

      if (event.key === 'Enter' && this.state.selectedSuggestionIndex >= 0) {
        event.preventDefault();
        const allItems = [...this.state.cities, ...this.state.streets, ...this.state.suggestions];

        const item = allItems[this.state.selectedSuggestionIndex];
        if (item) {
          this.selectItem(item);
          this.updateState({ selectedSuggestionIndex: -1 });
        }
        return;
      }
    }

    const val = target.value;

    if (event.key === ' ' && this.shouldAutoInsertComma(val)) {
      event.preventDefault();
      const next = `${val.trim()}, `;
      this.updateQueryAndFetch(next);
    }
  }

  /**
   * Manually selects a suggestion or a string value.
   * This is typically called when a user clicks a suggestion in the UI.
   * @param item The suggestion object or string to select.
   * @returns boolean True if the selection is a final address.
   */
  public selectItem(item: InferResult | string): boolean {
    this.debouncedFetch.cancel();
    if (this.abortController) {
      this.abortController.abort();
    }

    const label = typeof item === 'string' ? item : item.label;

    let logicValue = label;
    if (typeof item !== 'string' && typeof item.value === 'string') {
      logicValue = item.value;
    }
    const valueObj =
      typeof item !== 'string' && typeof item.value === 'object' ? item.value : undefined;

    const isFullResult = !!valueObj && Object.keys(valueObj).length > 0;

    if (this.state.stage === 'final' || isFullResult) {
      let finalQuery = label;

      if (valueObj && Object.keys(valueObj).length > 0) {
        const { street, street_number, postcode, city, addition } = valueObj;
        if (street && street_number && city) {
          const suffix = addition ? ` ${addition}` : '';
          const postcodeStr = postcode ? `${postcode}, ` : '';
          finalQuery = `${street} ${street_number}${suffix}, ${postcodeStr}${city}`;
        }
      }

      this.finishSelection(finalQuery, valueObj as AddressValue);
      return true;
    }

    const subtitle = typeof item !== 'string' ? item.subtitle : null;
    this.processSelection(logicValue, subtitle);
    return false;
  }

  private shouldAutoInsertComma(currentVal: string): boolean {
    const isStartOfSegmentAndNumeric =
      !currentVal.includes(',') && PATTERNS.DIGITS_1_3.test(currentVal.trim());
    if (isStartOfSegmentAndNumeric) return true;

    if (this.state.stage === 'street_number') {
      const currentFragment = this.getCurrentFragment(currentVal);
      return PATTERNS.DIGITS_1_3.test(currentFragment);
    }
    return false;
  }

  private finishSelection(label: string, value?: AddressValue): void {
    this.updateState({
      query: label,
      suggestions: [],
      cities: [],
      streets: [],
      isValid: true,
      value: value || null,
      stage: 'final',
      hasMore: false,
    });
    this.onSelect(value || label);
  }

  private processSelection(text: string, subtitle?: string | null): void {
    const { stage, query } = this.state;
    let nextQuery = query;

    const isContextualSelection =
      subtitle && (stage === 'city' || stage === 'street' || stage === 'mixed');

    if (isContextualSelection) {
      if (stage === 'city') {
        nextQuery = `${subtitle}, ${text}, `;
      } else {
        const prefix = this.getQueryPrefix(query);
        const shouldAddSubtitle = !prefix || !prefix.includes(subtitle!);

        let effectivePrefix = prefix;
        // If prefix is just a number (e.g. "200,") and subtitle starts with it ("200, 1234AB"),
        // ignore the prefix to avoid "200, Street, 200, 1234AB".
        if (prefix && subtitle) {
          const prefixNumMatch = prefix.match(PATTERNS.STREET_NUMBER_PREFIX);
          if (prefixNumMatch) {
            const num = prefixNumMatch[1];
            if (subtitle.startsWith(num)) {
              effectivePrefix = '';
            }
          }
        }

        if (shouldAddSubtitle) {
          nextQuery = effectivePrefix
            ? `${effectivePrefix} ${text}, ${subtitle}, `
            : `${text}, ${subtitle}, `;
        } else {
          nextQuery = effectivePrefix ? `${effectivePrefix} ${text}, ` : `${text}, `;
        }
      }
      this.updateQueryAndFetch(nextQuery);
      return;
    }

    if (stage === 'direct' || stage === 'addition') {
      this.finishSelection(text);
      return;
    }

    const hasComma = query.includes(',');
    const isFirstSegment =
      !hasComma && (stage === 'city' || stage === 'street' || stage === 'street_number_first');

    if (isFirstSegment) {
      nextQuery = `${text}, `;
    } else {
      nextQuery = this.replaceLastSegment(query, text);
      if (stage !== 'street_number') {
        nextQuery += ', ';
      }
    }

    this.updateQueryAndFetch(nextQuery);
  }

  private executeFetch(val: string, attempt: number = 0): void {
    const text = (val || '').toString();
    if (!text.trim()) {
      this.abortController?.abort();
      this.resetState();
      return;
    }

    if (attempt === 0) {
      this.updateState({ isError: false });
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
    }

    const currentSignal = this.abortController?.signal;

    const baseUrl = this.explicitApiUrl
      ? this.explicitApiUrl
      : `${DEFAULTS.API_URL}/infer/${this.country.toLowerCase()}`;

    const params = new URLSearchParams({
      query: text,
      limit: this.currentLimit.toString(),
    });

    if (this.explicitApiUrl) {
      params.append('country', this.country.toLowerCase());
    }

    if (this.authKey) {
      params.set('authKey', this.authKey);
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const finalUrl = `${baseUrl}${separator}${params.toString()}`;

    this.fetcher(finalUrl, { signal: currentSignal })
      .then((res) => {
        if (!res.ok) {
          if (attempt < this.maxRetries && (res.status >= 500 || res.status === 429)) {
            return this.retry(val, attempt, currentSignal);
          }
          throw new Error('Network error');
        }
        return res.json();
      })
      .then((data) => {
        if (data) this.mapResponseToState(data);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;

        if (attempt < this.maxRetries) {
          return this.retry(val, attempt, currentSignal);
        }

        this.updateState({ isError: true, isLoading: false });
      });
  }

  private retry(val: string, attempt: number, signal?: AbortSignal): void {
    if (signal?.aborted) return;

    const delay = Math.pow(2, attempt) * 200;
    setTimeout(() => {
      if (!signal?.aborted) {
        this.executeFetch(val, attempt + 1);
      }
    }, delay);
  }

  private mapResponseToState(data: any): void {
    const newState: Partial<InferState> = {
      stage: data.stage,
      isLoading: false,
    };

    const rawSuggestions = data.suggestions || [];
    const uniqueSuggestions: InferResult[] = [];
    const seen = new Set<string>();

    for (const item of rawSuggestions) {
      const key = `${item.label}|${item.subtitle || ''}|${JSON.stringify(item.value || {})}`;
      if (!seen.has(key)) {
        seen.add(key);
        const reformattedItem = this.reformatSuggestionLabel(item);
        uniqueSuggestions.push(reformattedItem);
      }
    }

    const totalCount =
      uniqueSuggestions.length + (data.cities?.length || 0) + (data.streets?.length || 0);
    newState.hasMore = totalCount >= this.currentLimit;

    if (data.stage === 'mixed') {
      newState.cities = data.cities || [];
      newState.streets = data.streets || [];

      if (newState.cities?.length === 0 && newState.streets?.length === 0) {
        newState.suggestions = uniqueSuggestions;
      } else {
        newState.suggestions = [];
      }
    } else {
      newState.suggestions = uniqueSuggestions;
      newState.cities = [];
      newState.streets = [];
    }

    newState.isValid = data.stage === 'final';
    this.updateState(newState);

    if (newState.isValid && uniqueSuggestions.length === 1) {
      this.selectItem(uniqueSuggestions[0]);
    }
  }

  /**
   * Reformats a suggestion's label based on the user's input order.
   * If the suggestion has a structured value object, we reorder the label
   * to match how the user typed the components.
   */
  private reformatSuggestionLabel(item: InferResult): InferResult {
    if (!item.value || typeof item.value === 'string') {
      return item;
    }

    const addressValue = item.value as AddressValue;
    if (!addressValue.street || !addressValue.city) {
      return item;
    }

    const reformattedLabel = formatLabelByInputOrder(this.state.query, addressValue);
    if (reformattedLabel) {
      return { ...item, label: reformattedLabel };
    }

    return item;
  }

  private updateQueryAndFetch(nextQuery: string): void {
    this.updateState({
      query: nextQuery,
      suggestions: [],
      cities: [],
      streets: [],
      isValid: false,
      value: null,
      isLoading: true,
      hasMore: false,
    });
    this.debouncedFetch(nextQuery);
  }

  private replaceLastSegment(fullText: string, newSegment: string): string {
    const lastCommaIndex = fullText.lastIndexOf(',');
    if (lastCommaIndex === -1) return newSegment;
    return `${fullText.slice(0, lastCommaIndex + 1)} ${newSegment}`.trim();
  }

  private getQueryPrefix(q: string): string {
    const lastComma = q.lastIndexOf(',');
    return lastComma === -1 ? '' : q.slice(0, lastComma + 1).trimEnd();
  }

  private getCurrentFragment(q: string): string {
    return (q.split(',').slice(-1)[0] ?? '').trim();
  }

  private resetState(): void {
    this.updateState({ ...INITIAL_STATE, query: this.state.query });
  }

  private updateState(updates: Partial<InferState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange(this.state);
  }

  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number,
  ): DebouncedFunction<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const debounced = (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };

    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
    };

    return debounced as DebouncedFunction<T>;
  }
}
