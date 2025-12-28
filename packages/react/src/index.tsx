import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  InferCore,
  InferConfig,
  InferState,
  InferResult,
  INITIAL_STATE,
  DEFAULT_STYLES,
} from '@pro6pp/infer-core';

/**
 * A headless React hook that provides the logic for address search using the Infer API.
 * @param config The engine configuration (authKey, country, etc.).
 * @returns An object containing the current state, the core instance, and pre-bound input props.
 */
export function useInfer(config: InferConfig) {
  const [state, setState] = useState<InferState>(INITIAL_STATE);

  const core = useMemo(() => {
    return new InferCore({
      ...config,
      onStateChange: (newState) => {
        setState({ ...newState });
        if (config.onStateChange) {
          config.onStateChange(newState);
        }
      },
    });
  }, [config.country, config.authKey, config.limit, config.debounceMs, config.maxRetries]);

  return {
    /** The current UI state (suggestions, loading status, query, etc.). */
    state,
    /** The raw InferCore instance for manual control. */
    core,
    /** Pre-configured event handlers to spread onto an <input /> element. */
    inputProps: {
      value: state.query,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => core.handleInput(e.target.value),
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => core.handleKeyDown(e),
    },
    /** Function to manually select a specific suggestion. */
    selectItem: (item: InferResult | string) => core.selectItem(item),
    /** Function to load more results. */
    loadMore: () => core.loadMore(),
  };
}

/**
 * Props for the Pro6PPInfer component.
 */
export interface Pro6PPInferProps extends InferConfig {
  /** Optional CSS class for the wrapper div. */
  className?: string;
  /** Optional inline styles for the wrapper div. */
  style?: React.CSSProperties;
  /** Attributes to pass directly to the underlying input element. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** * Custom placeholder text.
   * @default 'Start typing an address...'
   */
  placeholder?: string;
  /** A custom render function for individual suggestion items. */
  renderItem?: (item: InferResult, isActive: boolean) => React.ReactNode;
  /** * If true, prevents the default CSS theme from being injected.
   * @default false
   */
  disableDefaultStyles?: boolean;
  /** * The text to show when no results are found.
   * @default 'No results found'
   */
  noResultsText?: string;
  /** * The text to show on the load more button.
   * @default 'Show more results...'
   */
  loadMoreText?: string;
  /** A custom render function for the "no results" state. */
  renderNoResults?: (state: InferState) => React.ReactNode;
  /**
   * If true, shows a clear button when the input is not empty.
   * @default true
   */
  showClearButton?: boolean;
}

/**
 * A styled React component for Pro6PP Infer API.
 * Includes styling, keyboard navigation, and loading states.
 */
export const Pro6PPInfer: React.FC<Pro6PPInferProps> = ({
  className,
  style,
  inputProps,
  placeholder = 'Start typing an address...',
  renderItem,
  disableDefaultStyles = false,
  noResultsText = 'No results found',
  loadMoreText = 'Show more results...',
  renderNoResults,
  showClearButton = true,
  ...config
}) => {
  const { state, selectItem, loadMore, inputProps: coreInputProps, core } = useInfer(config);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disableDefaultStyles) return;
    const styleId = 'pro6pp-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = DEFAULT_STYLES;
      document.head.appendChild(styleEl);
    }
  }, [disableDefaultStyles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = useMemo(() => {
    return [
      ...state.cities.map((c) => ({ ...c, type: 'city' as const })),
      ...state.streets.map((s) => ({ ...s, type: 'street' as const })),
      ...state.suggestions.map((s) => ({ ...s, type: 'suggestion' as const })),
    ];
  }, [state.cities, state.streets, state.suggestions]);

  const handleSelect = (item: InferResult) => {
    selectItem(item);
    setIsOpen(false);
    if (!state.isValid && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = () => {
    core.handleInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasResults = items.length > 0;
  const showNoResults =
    !state.isLoading && !state.isError && state.query.length > 0 && !hasResults && !state.isValid;

  const showDropdown = isOpen && (hasResults || showNoResults);

  return (
    <div ref={wrapperRef} className={`pro6pp-wrapper ${className || ''}`} style={style}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="pro6pp-input"
          placeholder={placeholder}
          autoComplete="off"
          {...inputProps}
          {...coreInputProps}
          onFocus={(e) => {
            setIsOpen(true);
            inputProps?.onFocus?.(e);
          }}
        />
        <div className="pro6pp-input-addons">
          {state.isLoading && <div className="pro6pp-loader" />}
          {showClearButton && state.query.length > 0 && (
            <button
              type="button"
              className="pro6pp-clear-button"
              onClick={handleClear}
              aria-label="Clear input"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div
          className="pro6pp-dropdown"
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ul className="pro6pp-list" role="listbox">
            {hasResults ? (
              items.map((item, index) => {
                const isActive = index === state.selectedSuggestionIndex;
                const secondaryText = item.subtitle || (item.count !== undefined ? item.count : '');
                const showChevron = item.value === undefined || item.value === null;

                return (
                  <li
                    key={`${item.label}-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={`pro6pp-item ${isActive ? 'pro6pp-item--active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                  >
                    {renderItem ? (
                      renderItem(item, isActive)
                    ) : (
                      <>
                        <span className="pro6pp-item__label">{item.label}</span>
                        {secondaryText && (
                          <span className="pro6pp-item__subtitle">, {secondaryText}</span>
                        )}
                        {showChevron && (
                          <div className="pro6pp-item__chevron">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="pro6pp-no-results">
                {renderNoResults ? renderNoResults(state) : noResultsText}
              </li>
            )}
          </ul>
          {state.hasMore && (
            <button
              type="button"
              className="pro6pp-load-more"
              onClick={(e) => {
                e.preventDefault();
                loadMore();
              }}
            >
              {loadMoreText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export type {
  CountryCode,
  Stage,
  AddressValue,
  InferResult,
  InferState,
  InferConfig,
  Fetcher,
} from '@pro6pp/infer-core';
