import { InferCore, InferConfig, InferState } from '@pro6pp/infer-core';

const DEFAULT_STYLES = `
  .pro6pp-wrapper {
    position: relative;
    display: block;
    width: 100%;
  }

  .pro6pp-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10000;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 250px;
    overflow-y: auto;
  }

  .pro6pp-item {
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4;
    color: #1e293b;
    transition: background-color 0.15s ease;
  }

  .pro6pp-item:last-child {
    border-bottom: none;
  }

  .pro6pp-item:hover, .pro6pp-item--active {
    background-color: #f8fafc;
    color: #0f172a;
  }

  .pro6pp-item__subtitle {
    display: block;
    font-size: 0.85em;
    color: #64748b;
    margin-top: 2px;
  }
`;

export interface InferJSConfig extends InferConfig {
  style?: 'default' | 'none';
}

export class InferJS {
  private core: InferCore;
  private input: HTMLInputElement;
  private list!: HTMLUListElement;
  private wrapper!: HTMLDivElement;
  private useDefaultStyles: boolean;

  constructor(target: string | HTMLInputElement, config: InferJSConfig) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || !(el instanceof HTMLInputElement)) {
      throw new Error(`InferJS: Target element not found or is not an input.`);
    }
    this.input = el;
    this.useDefaultStyles = config.style !== 'none';

    if (this.useDefaultStyles) {
      this.injectStyles();
    }

    this.core = new InferCore({
      ...config,
      onStateChange: (state) => this.render(state),
      onSelect: (selection) => {
        if (typeof selection === 'string') {
          this.input.value = selection;
        } else if (selection && typeof selection === 'object') {
          this.input.value = this.core.state.query;
        }
        if (config.onSelect) config.onSelect(selection);
      },
    });

    this.setupDOM();
    this.bindEvents();
  }

  private injectStyles() {
    const styleId = 'pro6pp-infer-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = DEFAULT_STYLES;
      document.head.appendChild(styleEl);
    }
  }

  private setupDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'pro6pp-wrapper';

    // move input into wrapper
    this.input.parentNode?.insertBefore(this.wrapper, this.input);
    this.wrapper.appendChild(this.input);

    // dropdown List
    this.list = document.createElement('ul');
    this.list.className = 'pro6pp-dropdown';
    this.list.style.display = 'none';
    this.wrapper.appendChild(this.list);
  }

  private bindEvents() {
    this.input.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.core.handleInput(val);
    });

    this.input.addEventListener('keydown', (e) => {
      this.core.handleKeyDown(e);
    });

    // close on click outside
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target as Node)) {
        this.list.style.display = 'none';
      }
    });
  }

  private render(state: InferState) {
    if (this.input.value !== state.query) {
      this.input.value = state.query;
    }

    this.list.innerHTML = '';

    const items = [
      ...state.cities.map((c) => ({ item: c, type: 'city' })),
      ...state.streets.map((s) => ({ item: s, type: 'street' })),
      ...state.suggestions.map((s) => ({ item: s, type: 'suggestion' })),
    ];

    if (items.length === 0) {
      this.list.style.display = 'none';
      return;
    }

    this.list.style.display = 'block';

    items.forEach(({ item }, index) => {
      const li = document.createElement('li');
      li.className = 'pro6pp-item';

      if (index === state.selectedSuggestionIndex) {
        li.classList.add('pro6pp-item--active');
      }

      li.setAttribute('role', 'option');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'pro6pp-item__label';
      labelSpan.textContent = item.label;
      li.appendChild(labelSpan);

      if (item.subtitle) {
        const subSpan = document.createElement('span');
        subSpan.className = 'pro6pp-item__subtitle';
        subSpan.textContent = item.subtitle;
        li.appendChild(subSpan);
      }

      li.onclick = (e) => {
        e.stopPropagation();
        this.core.selectItem(item);
      };

      this.list.appendChild(li);
    });
  }
}

export function attach(target: string | HTMLInputElement, config: InferJSConfig) {
  return new InferJS(target, config);
}
