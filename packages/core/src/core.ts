import { InferConfig, InferState, InferResult, Fetcher, AddressValue, CountryCode } from './types';

const DEFAULTS = {
  API_URL: 'https://api.pro6pp.nl/v2',
  LIMIT: 1000,
  DEBOUNCE_MS: 300,
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
  private authKey: string;
  private apiUrl: string;
  private limit: number;
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
    this.apiUrl = config.apiUrl || DEFAULTS.API_URL;
    this.limit = config.limit || DEFAULTS.LIMIT;
    this.fetcher = config.fetcher || ((url, init) => fetch(url, init));
    this.onStateChange = config.onStateChange || (() => {});
    this.onSelect = config.onSelect || (() => {});
    this.state = { ...INITIAL_STATE };

    this.debouncedFetch = this.debounce(
      (val: string) => this.executeFetch(val),
      DEFAULTS.DEBOUNCE_MS,
    );
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

    const isEditingFinal = this.state.stage === 'final' && value !== this.state.query;

    this.updateState({
      query: value,
      isValid: false,
      isLoading: !!value.trim(),
      selectedSuggestionIndex: -1,
    });

    if (isEditingFinal) {
      this.onSelect(null);
    }

    this.debouncedFetch(value);
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
   */
  public selectItem(item: InferResult | string): void {
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
      return;
    }

    const subtitle = typeof item !== 'string' ? item.subtitle : null;
    this.processSelection(logicValue, subtitle);
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
    });
    this.onSelect(value || label);
    setTimeout(() => {
      this.isSelecting = false;
    }, 0);
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

  private executeFetch(val: string): void {
    const text = (val || '').toString();
    if (!text.trim()) {
      this.abortController?.abort();
      this.resetState();
      return;
    }

    this.updateState({ isError: false });
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    const url = new URL(`${this.apiUrl}/infer/${this.country.toLowerCase()}`);
    const params = {
      authKey: this.authKey,
      query: text,
      limit: this.limit.toString(),
    };
    url.search = new URLSearchParams(params).toString();

    this.fetcher(url.toString(), { signal: this.abortController.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => this.mapResponseToState(data))
      .catch((e) => {
        if (e.name !== 'AbortError') {
          this.updateState({ isError: true, isLoading: false });
        }
      });
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

    if (data.stage === 'mixed') {
      newState.cities = data.cities || [];
      newState.streets = data.streets || [];
      newState.suggestions = [];
    } else {
      newState.suggestions = uniqueSuggestions;
      newState.cities = [];
      newState.streets = [];

      if (data.stage === 'final' && uniqueSuggestions.length === 1) {
        autoSelect = true;
        autoSelectItem = uniqueSuggestions[0];
      }
    }

    newState.isValid = data.stage === 'final';

    if (autoSelect && autoSelectItem) {
      newState.query = autoSelectItem.label;
      newState.suggestions = [];
      newState.cities = [];
      newState.streets = [];
      newState.isValid = true;
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
    this.updateState({ isLoading: true, isValid: false });
    this.debouncedFetch(nextQuery);

    setTimeout(() => {
      this.isSelecting = false;
    }, 0);
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
