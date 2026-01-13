import {
  InferCore,
  InferConfig,
  InferState,
  DEFAULT_STYLES,
  getHighlightSegments,
} from '@pro6pp/infer-core';

/**
 * Configuration options for the JS Infer SDK.
 */
export interface InferJSConfig extends InferConfig {
  /**
   * The styling theme to apply.
   * - `default`: Injects the standard Pro6PP CSS theme.
   * - `none`: No styles are applied, allowing for custom CSS.
   * @default 'default'
   */
  style?: 'default' | 'none';
  /**
   * Custom placeholder text for the input field.
   */
  placeholder?: string;
  /**
   * Additional CSS classes to add to the input element.
   */
  inputClass?: string;
  /**
   * The text to display when no suggestions are found.
   * @default 'No results found'
   */
  noResultsText?: string;
  /**
   * The text to show on the load more button.
   * @default 'Show more results...'
   */
  loadMoreText?: string;
  /**
   * If true, shows a clear button when the input is not empty.
   * @default true
   */
  showClearButton?: boolean;
}

/**
 * The JS implementation of the Pro6PP Infer SDK.
 * This class manages the DOM elements, event listeners, and rendering for the autocomplete UI.
 */
export class InferJS {
  private core: InferCore;
  private input: HTMLInputElement;
  private list!: HTMLUListElement;
  private dropdown!: HTMLDivElement;
  private wrapper!: HTMLDivElement;
  private loader!: HTMLDivElement;
  private clearButton!: HTMLButtonElement;
  private loadMoreButton!: HTMLButtonElement;
  private useDefaultStyles: boolean;
  private noResultsText: string;
  private loadMoreText: string;
  private showClearButton: boolean;
  private isOpen: boolean = false;

  /**
   * Initializes the Infer logic on a target element.
   * @param target Either a CSS selector string or a direct HTMLElement.
   * @param config Configuration options for the API and UI.
   */
  constructor(target: string | HTMLElement, config: InferJSConfig) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      throw new Error(`InferJS: Target element not found.`);
    }

    this.noResultsText = config.noResultsText || 'No results found';
    this.loadMoreText = config.loadMoreText || 'Show more results...';
    this.showClearButton = config.showClearButton !== false;
    this.useDefaultStyles = config.style !== 'none';

    if (this.useDefaultStyles) {
      this.injectStyles();
    }

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'pro6pp-wrapper';

    if (el instanceof HTMLInputElement) {
      this.input = el;
      this.input.parentNode?.insertBefore(this.wrapper, this.input);
      this.wrapper.appendChild(this.input);
    } else {
      el.appendChild(this.wrapper);
      this.input = document.createElement('input');
      this.input.type = 'text';
      if (config.placeholder) this.input.placeholder = config.placeholder;
      this.wrapper.appendChild(this.input);
    }

    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('autocorrect', 'off');
    this.input.setAttribute('autocapitalize', 'none');
    this.input.setAttribute('spellcheck', 'false');
    this.input.setAttribute('inputmode', 'search');
    this.input.setAttribute('enterkeyhint', 'search');

    if (this.useDefaultStyles) {
      this.input.classList.add('pro6pp-input');
    }

    if (config.inputClass) {
      const classes = config.inputClass.split(' ');
      this.input.classList.add(...classes);
    }

    const addons = document.createElement('div');
    addons.className = 'pro6pp-input-addons';
    this.wrapper.appendChild(addons);

    this.loader = document.createElement('div');
    this.loader.className = 'pro6pp-loader';
    this.loader.style.display = 'none';
    addons.appendChild(this.loader);

    this.clearButton = document.createElement('button');
    this.clearButton.type = 'button';
    this.clearButton.className = 'pro6pp-clear-button';
    this.clearButton.setAttribute('aria-label', 'Clear input');
    this.clearButton.style.display = 'none';
    this.clearButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    addons.appendChild(this.clearButton);

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'pro6pp-dropdown';
    this.dropdown.style.display = 'none';
    this.wrapper.appendChild(this.dropdown);

    this.list = document.createElement('ul');
    this.list.className = 'pro6pp-list';
    this.list.setAttribute('role', 'listbox');
    this.dropdown.appendChild(this.list);

    this.loadMoreButton = document.createElement('button');
    this.loadMoreButton.type = 'button';
    this.loadMoreButton.className = 'pro6pp-load-more';
    this.loadMoreButton.textContent = this.loadMoreText;
    this.loadMoreButton.style.display = 'none';
    this.dropdown.appendChild(this.loadMoreButton);

    this.core = new InferCore({
      ...config,
      onStateChange: (state) => {
        this.render(state);
        if (config.onStateChange) {
          config.onStateChange(state);
        }
      },
      onSelect: (selection) => {
        if (typeof selection === 'string') {
          this.input.value = selection;
        } else if (selection && typeof selection === 'object') {
          this.input.value = this.core.state.query;
        }
        if (config.onSelect) config.onSelect(selection);
      },
    });

    this.bindEvents();
  }

  private injectStyles() {
    const styleId = 'pro6pp-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = DEFAULT_STYLES;
      document.head.appendChild(styleEl);
    }
  }

  private bindEvents() {
    this.input.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.isOpen = true;
      this.core.handleInput(val);
    });

    this.input.addEventListener('keydown', (e) => {
      this.core.handleKeyDown(e);
    });

    this.clearButton.addEventListener('click', () => {
      this.core.handleInput('');
      this.input.focus();
    });

    this.loadMoreButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.core.loadMore();
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.wrapper.contains(e.target as Node)) {
        this.isOpen = false;
        this.dropdown.style.display = 'none';
      }
    });

    this.input.addEventListener('focus', () => {
      this.isOpen = true;
      this.render(this.core.state);
    });
  }

  private render(state: InferState) {
    if (this.input.value !== state.query) {
      this.input.value = state.query;
    }

    this.loader.style.display = state.isLoading ? 'block' : 'none';

    if (this.showClearButton) {
      this.clearButton.style.display = state.query.length > 0 ? 'flex' : 'none';
    }

    this.list.innerHTML = '';

    const items = [...state.cities, ...state.streets, ...state.suggestions];
    const hasResults = items.length > 0;

    const showNoResults =
      !state.isLoading && !state.isError && state.query.length > 0 && !hasResults && !state.isValid;

    const shouldShowDropdown = this.isOpen && (hasResults || state.isLoading || showNoResults);

    if (!shouldShowDropdown) {
      this.dropdown.style.display = 'none';
      return;
    }

    this.dropdown.style.display = 'block';
    this.loadMoreButton.style.display = state.hasMore ? 'block' : 'none';

    if (state.isLoading && !hasResults) {
      const li = document.createElement('li');
      li.className = 'pro6pp-no-results';
      li.textContent = 'Loading suggestions...';
      this.list.appendChild(li);
      return;
    }

    if (showNoResults) {
      const li = document.createElement('li');
      li.className = 'pro6pp-no-results';
      li.textContent = this.noResultsText;
      this.list.appendChild(li);
      return;
    }

    items.forEach((item, index) => {
      if (!item.label) return;

      const li = document.createElement('li');
      li.className = 'pro6pp-item';

      if (index === state.selectedSuggestionIndex) {
        li.classList.add('pro6pp-item--active');
      }

      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', index === state.selectedSuggestionIndex ? 'true' : 'false');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'pro6pp-item__label';

      const segments = getHighlightSegments(item.label, state.query);
      segments.forEach(({ text, match }) => {
        if (match) {
          const strong = document.createElement('strong');
          strong.className = 'pro6pp-item__label--match';
          strong.textContent = text;
          labelSpan.appendChild(strong);
        } else {
          labelSpan.appendChild(document.createTextNode(text));
        }
      });

      li.appendChild(labelSpan);

      const countVal = item.count !== undefined && item.count !== null ? item.count : '';
      const secondaryText = item.subtitle || countVal;

      if (secondaryText !== '') {
        const subSpan = document.createElement('span');
        subSpan.className = 'pro6pp-item__subtitle';
        subSpan.textContent = `, ${secondaryText}`;
        li.appendChild(subSpan);
      }

      const showChevron = item.value === undefined || item.value === null;

      if (showChevron) {
        const chevron = document.createElement('div');
        chevron.className = 'pro6pp-item__chevron';
        chevron.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
        li.appendChild(chevron);
      }

      li.onmousedown = (e) => e.preventDefault();
      li.onclick = (e) => {
        e.stopPropagation();

        const isFinal = this.core.selectItem(item);

        if (!isFinal) {
          setTimeout(() => this.input.focus(), 0);
        } else {
          this.isOpen = false;
          this.dropdown.style.display = 'none';
        }
      };

      this.list.appendChild(li);
    });
  }
}

/**
 * A helper to initialize the Pro6PP Infer SDK on a target element.
 * @param target A CSS selector string or HTMLElement.
 * @param config Configuration for the SDK.
 * @returns An instance of InferJS.
 */
export function attach(target: string | HTMLElement, config: InferJSConfig) {
  return new InferJS(target, config);
}
