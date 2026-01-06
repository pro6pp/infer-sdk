import { InferConfig, InferState, InferResult, Fetcher, AddressValue, CountryCode } from './types';

const DEFAULTS = {
  API_URL: 'https://api.pro6pp.nl/v2',
  LIMIT: 20,
  DEBOUNCE_MS: 150,
  MIN_DEBOUNCE_MS: 50,
  MAX_RETRIES: 0,
};

const PATTERNS = {
  DIGITS_1_3: /^[0-9]{1,3}$/,
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

  private isSelecting: boolean = false;

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
    if (this.isSelecting) {
      this.isSelecting = false;
      return;
    }

    this.currentLimit = this.baseLimit;

    const isEditingFinal = this.state.stage === 'final' && value !== this.state.query;

    this.updateState({
      query: value,
      isValid: false,
      isLoading: !!value.trim(),
      selectedSuggestionIndex: -1,
      hasMore: false,
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
   * - `Space`: Automatically inserts a comma if a numeric house number is detected.
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

    this.isSelecting = true;

    if (this.state.stage === 'final' || isFullResult) {
      let finalQuery = label;

      if (valueObj && Object.keys(valueObj).length > 0) {
        const { street, street_number, house_number, city } = valueObj;
        const number = street_number || house_number;
        if (street && number && city) {
          finalQuery = `${street} ${number}, ${city}`;
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

    if (this.state.stage === 'house_number') {
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
        nextQuery = prefix ? `${prefix} ${text}, ${subtitle}, ` : `${text}, ${subtitle}, `;
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
      !hasComma && (stage === 'city' || stage === 'street' || stage === 'house_number_first');

    if (isFirstSegment) {
      nextQuery = `${text}, `;
    } else {
      nextQuery = this.replaceLastSegment(query, text);
      if (stage !== 'house_number') {
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
      country: this.country.toLowerCase(),
      query: text,
      limit: this.currentLimit.toString(),
    });

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

    let autoSelect = false;
    let autoSelectItem: InferResult | null = null;

    const rawSuggestions = data.suggestions || [];
    const uniqueSuggestions: InferResult[] = [];
    const seen = new Set<string>();

    for (const item of rawSuggestions) {
      const key = `${item.label}|${item.subtitle || ''}|${JSON.stringify(item.value || {})}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSuggestions.push(item);
      }
    }

    const totalCount =
      uniqueSuggestions.length + (data.cities?.length || 0) + (data.streets?.length || 0);
    newState.hasMore = totalCount >= this.currentLimit;

    if (data.stage === 'mixed') {
      newState.cities = data.cities || [];
      newState.streets = data.streets || [];
      newState.suggestions = [];
    } else {
      newState.suggestions = uniqueSuggestions;
      newState.cities = [];
      newState.streets = [];

      const firstItem = uniqueSuggestions[0];
      const hasFullValue =
        firstItem &&
        typeof firstItem.value === 'object' &&
        firstItem.value !== null &&
        Object.keys(firstItem.value).length > 0;

      if ((data.stage === 'final' || hasFullValue) && uniqueSuggestions.length === 1) {
        autoSelect = true;
        autoSelectItem = firstItem;
      }
    }

    newState.isValid = data.stage === 'final';

    if (autoSelect && autoSelectItem) {
      newState.query = autoSelectItem.label;
      newState.suggestions = [];
      newState.cities = [];
      newState.streets = [];
      newState.isValid = true;
      newState.hasMore = false;
      this.isSelecting = true;
      this.updateState(newState);

      const val =
        typeof autoSelectItem.value === 'object' ? autoSelectItem.value : autoSelectItem.label;
      this.onSelect(val);
    } else {
      this.updateState(newState);
    }
  }

  private updateQueryAndFetch(nextQuery: string): void {
    this.updateState({ query: nextQuery, suggestions: [], cities: [], streets: [] });
    this.updateState({ isLoading: true, isValid: false, hasMore: false });
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
