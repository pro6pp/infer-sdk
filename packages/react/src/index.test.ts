import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInfer } from './index';

describe('useInfer (Integration)', () => {
  let mockFetcher: Mock;

  beforeEach(() => {
    mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [], cities: [], streets: [] }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useInfer({ authKey: 'test', country: 'NL', fetcher: mockFetcher }),
    );

    expect(result.current.state.query).toBe('');
    expect(result.current.state.suggestions).toEqual([]);
    expect(result.current.core).toBeDefined();
  });

  it('should trigger a fetch and update state on input', async () => {
    const mockResponse = {
      stage: 'city',
      suggestions: [{ label: 'Amsterdam' }],
    };

    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() =>
      useInfer({ authKey: 'test', country: 'NL', fetcher: mockFetcher }),
    );

    act(() => {
      const event = { target: { value: 'Ams' } } as React.ChangeEvent<HTMLInputElement>;
      result.current.inputProps.onChange(event);
    });

    expect(result.current.state.query).toBe('Ams');
    expect(result.current.state.isLoading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.state.suggestions).toHaveLength(1);
      },
      { timeout: 2000 },
    );

    expect(result.current.state.suggestions[0].label).toBe('Amsterdam');
    expect(result.current.state.isLoading).toBe(false);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    mockFetcher.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() =>
      useInfer({ authKey: 'test', country: 'NL', fetcher: mockFetcher }),
    );

    act(() => {
      result.current.inputProps.onChange({ target: { value: 'Error' } } as any);
    });

    await waitFor(
      () => {
        expect(result.current.state.isError).toBe(true);
      },
      { timeout: 2000 },
    );

    expect(result.current.state.isLoading).toBe(false);
  });

  it('should handle selection and update query', () => {
    const { result } = renderHook(() =>
      useInfer({ authKey: 'test', country: 'NL', fetcher: mockFetcher }),
    );

    act(() => {
      const item = { label: 'Rotterdam' };
      result.current.selectItem(item);
    });

    expect(result.current.state.query).toBe('Rotterdam, ');
  });

  it('should handle keyboard navigation', async () => {
    // setup fetcher to return results so we have something to navigate
    const mockResponse = {
      stage: 'city',
      suggestions: [{ label: 'Amsterdam' }, { label: 'Rotterdam' }],
    };

    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() =>
      useInfer({ authKey: 'test', country: 'NL', fetcher: mockFetcher }),
    );

    // trigger search to populate state
    act(() => {
      result.current.inputProps.onChange({ target: { value: 'A' } } as any);
    });

    await waitFor(() => {
      expect(result.current.state.suggestions).toHaveLength(2);
    });

    // press ArrowDown
    act(() => {
      const event = {
        key: 'ArrowDown',
        target: { value: 'A' },
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      result.current.inputProps.onKeyDown(event);
    });

    expect(result.current.state.selectedSuggestionIndex).toBe(0);

    // press ArrowDown again
    act(() => {
      const event = {
        key: 'ArrowDown',
        target: { value: 'A' },
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      result.current.inputProps.onKeyDown(event);
    });

    expect(result.current.state.selectedSuggestionIndex).toBe(1);
  });
});
