import { useState, useMemo } from 'react';
import { InferCore, InferConfig, InferState, InferResult, INITIAL_STATE } from '@pro6pp/infer-core';

/**
 * Hook for the Pro6PP Infer API.
 * @param config - The API configuration.
 * @returns An object containing the current state, input helpers, and selection handler.
 * @example
 * const { state, inputProps, selectItem } = useInfer({
 *   authKey: 'YOUR_KEY',
 *   country: 'NL'
 * });
 */
export function useInfer(config: InferConfig) {
  const [state, setState] = useState<InferState>(INITIAL_STATE);

  const core = useMemo(() => {
    return new InferCore({
      ...config,
      onStateChange: (newState) => setState({ ...newState }),
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

export type {
  CountryCode,
  Stage,
  AddressValue,
  InferResult,
  InferState,
  InferConfig,
  Fetcher,
} from '@pro6pp/infer-core';
