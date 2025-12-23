import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  InferCore,
  InferConfig,
  InferState,
  InferResult,
  INITIAL_STATE,
  DEFAULT_STYLES,
} from '@pro6pp/infer-core';

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
  }, [config.country, config.authKey, config.limit]);

  return {
    state,
    core,
    inputProps: {
      value: state.query,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => core.handleInput(e.target.value),
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => core.handleKeyDown(e),
    },
    selectItem: (item: InferResult | string) => core.selectItem(item),
  };
}

export interface Pro6PPInferProps extends InferConfig {
  className?: string;
  style?: React.CSSProperties;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  placeholder?: string;
  renderItem?: (item: InferResult, isActive: boolean) => React.ReactNode;
  disableDefaultStyles?: boolean;
  noResultsText?: string;
  renderNoResults?: (state: InferState) => React.ReactNode;
}

export const Pro6PPInfer: React.FC<Pro6PPInferProps> = ({
  className,
  style,
  inputProps,
  placeholder = 'Start typing an address...',
  renderItem,
  disableDefaultStyles = false,
  noResultsText = 'No results found',
  renderNoResults,
  ...config
}) => {
  const { state, selectItem, inputProps: coreInputProps } = useInfer(config);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const items = useMemo(() => {
    return [
      ...state.cities.map((c) => ({ ...c, type: 'city' as const })),
      ...state.streets.map((s) => ({ ...s, type: 'street' as const })),
      ...state.suggestions.map((s) => ({ ...s, type: 'suggestion' as const })),
    ];
  }, [state.cities, state.streets, state.suggestions]);

  const handleSelect = (item: InferResult) => {
    selectItem(item);
    if (!state.isValid && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasResults = items.length > 0;

  const showNoResults =
    !state.isLoading && !state.isError && state.query.length > 0 && !hasResults && !state.isValid;

  const showDropdown = hasResults || showNoResults;

  return (
    <div className={`pro6pp-wrapper ${className || ''}`} style={style}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="pro6pp-input"
          placeholder={placeholder}
          autoComplete="off"
          {...inputProps}
          {...coreInputProps}
        />
        {state.isLoading && <div className="pro6pp-loader" />}
      </div>

      {showDropdown && (
        <ul className="pro6pp-dropdown" role="listbox">
          {hasResults ? (
            items.map((item, index) => {
              const isActive = index === state.selectedSuggestionIndex;
              const secondaryText = item.subtitle || item.count;
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
