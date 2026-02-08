import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { InferCore, INITIAL_STATE } from './core';
import { InferConfig, InferState, InferResult, AddressValue, Fetcher } from './types';

describe('InferCore', () => {
  let core: InferCore;
  let mockFetcher: Mock<Fetcher>;
  let onStateChange: Mock<(state: InferState) => void>;
  let onSelect: Mock<(selection: AddressValue | string | null) => void>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    onStateChange = vi.fn();
    onSelect = vi.fn();

    const config: InferConfig = {
      authKey: 'test-auth-key',
      country: 'NL',
      fetcher: mockFetcher,
      limit: 10,
      onStateChange,
      onSelect,
    };

    core = new InferCore(config);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(core.state).toEqual(INITIAL_STATE);
    });

    it('should configure instance properties correctly', () => {
      expect(core['country']).toBe('NL');
      expect(core['authKey']).toBe('test-auth-key');
    });
  });

  describe('Input Handling & Debouncing', () => {
    it('should update state immediately on input', () => {
      core.handleInput('Klok');

      expect(core.state.query).toBe('Klok');
      expect(core.state.isLoading).toBe(true);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Klok',
          isLoading: true,
        }),
      );
    });

    it('should debounce the API fetch', () => {
      core.handleInput('K');
      core.handleInput('Kl');
      core.handleInput('Klo');

      expect(mockFetcher).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(mockFetcher).toHaveBeenCalledTimes(1);

      const callArgs = mockFetcher.mock.calls[0];
      const urlString = callArgs[0] as string;
      expect(urlString).toContain('query=Klo');
    });

    it('should abort previous pending requests', () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

      core.handleInput('first');
      vi.advanceTimersByTime(300);

      core.handleInput('second');
      vi.advanceTimersByTime(300);

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('API Interaction', () => {
    it('should construct the correct API URL', () => {
      core.handleInput('Eindhoven');
      vi.advanceTimersByTime(300);

      const callArgs = mockFetcher.mock.calls[0];
      const url = new URL(callArgs[0] as string);

      expect(url.origin).toBe('https://api.pro6pp.nl');
      expect(url.pathname).toBe('/v2/infer/nl');
      expect(url.searchParams.get('authKey')).toBe('test-auth-key');
      expect(url.searchParams.get('query')).toBe('Eindhoven');
      expect(url.searchParams.get('limit')).toBe('10');
    });

    it('should map "mixed" stage response to state', async () => {
      const mockResponse = {
        stage: 'mixed',
        cities: [{ label: 'Eindhoven' }],
        streets: [{ label: 'Klokgebouw' }],
        suggestions: [],
      };

      mockFetcher.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      core.handleInput('Klok');
      vi.advanceTimersByTime(300);

      await vi.waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: 'mixed',
            cities: mockResponse.cities,
            streets: mockResponse.streets,
            suggestions: [],
            isLoading: false,
          }),
        );
      });
    });

    it('should map "suggestions" stage response to state', async () => {
      const mockResponse = {
        stage: 'street',
        suggestions: [{ label: 'Klokgebouw' }],
      };

      mockFetcher.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      core.handleInput('Klok');
      vi.advanceTimersByTime(300);

      await vi.waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: 'street',
            suggestions: mockResponse.suggestions,
            cities: [],
            streets: [],
          }),
        );
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetcher.mockRejectedValue(new Error('Network Error'));

      core.handleInput('Fail');
      vi.advanceTimersByTime(300);

      await vi.waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isError: true,
            isLoading: false,
          }),
        );
      });
    });
  });

  describe('Selection Logic', () => {
    it('should handle final address selection (Amsterdam)', () => {
      Object.assign(core.state, { stage: 'final' });

      const address: AddressValue = {
        street: 'Dam',
        city: 'Amsterdam',
        street_number: 1,
        postcode: '1012JS',
      };

      const item: InferResult = {
        label: 'Dam 1, 1012JS, Amsterdam',
        value: address,
      };

      core.selectItem(item);

      expect(onSelect).toHaveBeenCalledWith(address);
      expect(core.state.isValid).toBe(true);
      expect(core.state.query).toBe('Dam 1, 1012JS, Amsterdam');
    });

    it('should append comma for intermediate selection in city/street stage', () => {
      Object.assign(core.state, { stage: 'city', query: 'Eind' });

      core.selectItem({ label: 'Eindhoven' });

      expect(core.state.query).toBe('Eindhoven, ');
      expect(core.state.isLoading).toBe(true);
    });

    it('should replace last segment and append comma', () => {
      Object.assign(core.state, { stage: 'street', query: 'Eindhoven, Klo' });

      core.selectItem({ label: 'Klokgebouw' });

      expect(core.state.query).toBe('Eindhoven, Klokgebouw, ');
    });

    it('should handle contextual selection (subtitle)', () => {
      // user typed 'Klok' and selects 'Klokgebouw' which is in Eindhoven
      Object.assign(core.state, { stage: 'mixed', query: 'Klok' });

      core.selectItem({
        label: 'Klokgebouw',
        subtitle: 'Eindhoven',
      });

      expect(core.state.query).toBe('Klokgebouw, Eindhoven, ');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should auto-insert comma on Space if input is numeric (1-3 digits)', () => {
      const input = document.createElement('input');
      input.value = '50'; // street number

      const event = {
        target: input,
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      core.handleKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(core.state.query).toBe('50, ');
    });

    it('should NOT auto-insert comma on Space for non-numeric input', () => {
      const input = document.createElement('input');
      input.value = 'Amsterdam';

      const event = {
        target: input,
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      core.handleKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(core.state.query).toBe('');
    });

    it('should auto-insert comma in street_number stage', () => {
      Object.assign(core.state, { stage: 'street_number', query: 'Eindhoven, Klokgebouw, 50' });

      const input = document.createElement('input');
      input.value = 'Eindhoven, Klokgebouw, 50';

      const event = {
        target: input,
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      core.handleKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(core.state.query).toBe('Eindhoven, Klokgebouw, 50, ');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      core.state.cities = [{ label: 'City A', value: {} } as any];
      core.state.streets = [{ label: 'Street B', value: {} } as any];
      core.state.suggestions = [{ label: 'Suggestion C', value: {} } as any];
    });

    it('should cycle selection with ArrowDown', () => {
      const event = { key: 'ArrowDown', preventDefault: vi.fn(), target: { value: '' } } as any;

      // press down - index 0
      core.handleKeyDown(event);
      expect(core.state.selectedSuggestionIndex).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();

      // press down - index 1
      core.handleKeyDown(event);
      expect(core.state.selectedSuggestionIndex).toBe(1);

      // press down - index 2
      core.handleKeyDown(event);
      expect(core.state.selectedSuggestionIndex).toBe(2);

      // press down - loop back to 0
      core.handleKeyDown(event);
      expect(core.state.selectedSuggestionIndex).toBe(0);
    });

    it('should cycle selection with ArrowUp', () => {
      const event = { key: 'ArrowUp', preventDefault: vi.fn(), target: { value: '' } } as any;

      // initial state is -1.
      core.handleKeyDown(event);
      // assert pressing Up goes to last item in index 2
      expect(core.state.selectedSuggestionIndex).toBe(2);

      // press Up - index 1
      core.handleKeyDown(event);
      expect(core.state.selectedSuggestionIndex).toBe(1);
    });

    it('should select the highlighted item on Enter', () => {
      const enterEvent = { key: 'Enter', preventDefault: vi.fn(), target: { value: '' } } as any;
      const downEvent = { key: 'ArrowDown', preventDefault: vi.fn(), target: { value: '' } } as any;

      // highlight the first item
      core.handleKeyDown(downEvent);
      expect(core.state.selectedSuggestionIndex).toBe(0);

      core.handleKeyDown(enterEvent);

      // expect selection logic to trigger
      expect(core.state.query).toBe('City A, ');
      expect(core.state.selectedSuggestionIndex).toBe(-1);
      expect(enterEvent.preventDefault).toHaveBeenCalled();
    });

    it('should reset selection index when typing', () => {
      const downEvent = { key: 'ArrowDown', preventDefault: vi.fn(), target: { value: '' } } as any;

      core.handleKeyDown(downEvent);
      expect(core.state.selectedSuggestionIndex).toBe(0);

      core.handleInput('New');

      // assert index resets
      expect(core.state.selectedSuggestionIndex).toBe(-1);
    });
  });

  describe('Edge Cases & Stage Logic', () => {
    it('should reset state when input is empty', () => {
      Object.assign(core.state, { query: 'Eindhoven', stage: 'city' });

      core.handleInput('');

      vi.advanceTimersByTime(300); // triggers debounced reset

      expect(core.state.stage).toBeNull();
      expect(core.state.cities).toEqual([]);
      expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('should clear selection when editing after final stage', () => {
      Object.assign(core.state, { stage: 'final', isValid: true });

      core.handleInput('New Input');

      expect(onSelect).toHaveBeenCalledWith(null);
      expect(core.state.isValid).toBe(false);
    });

    it('should finish selection immediately for "direct" stage (e.g. PO Box)', () => {
      Object.assign(core.state, { stage: 'direct', query: 'Postbus' });

      core.selectItem({ label: 'Postbus 123' });

      // should finish selection, update query, but not append comma
      expect(core.state.query).toBe('Postbus 123');
      expect(core.state.isValid).toBe(true);
      expect(onSelect).toHaveBeenCalledWith('Postbus 123');
    });

    it('should NOT append comma when selecting item in "street_number" stage', () => {
      Object.assign(core.state, {
        stage: 'street_number',
        query: 'Klokgebouw, 5',
      });

      core.selectItem({ label: '50' });

      // should replace segment but not add comma
      expect(core.state.query).toBe('Klokgebouw, 50');
      // should trigger fetch for next details
      expect(core.state.isLoading).toBe(true);
    });

    it('should handle contextual selection when stage is "city"', () => {
      Object.assign(core.state, { stage: 'city', query: 'Eind' });

      core.selectItem({
        label: 'Eindhoven',
        subtitle: 'Noord-Brabant',
      });

      expect(core.state.query).toBe('Noord-Brabant, Eindhoven, ');
    });

    it('should finish selection immediately for "addition" stage', () => {
      Object.assign(core.state, { stage: 'addition', query: 'Dam 1' });

      core.selectItem({ label: 'Dam 1 A' });

      expect(core.state.query).toBe('Dam 1 A');
      expect(core.state.isValid).toBe(true);
      expect(onSelect).toHaveBeenCalledWith('Dam 1 A');
    });
  });

  describe('Pagination & Infinite Scroll', () => {
    it('should increase limit and re-fetch when loadMore is called', () => {
      core.handleInput('Eindhoven');
      vi.advanceTimersByTime(300);

      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // verify initial limit
      const firstCallUrl = mockFetcher.mock.calls[0][0] as string;
      expect(firstCallUrl).toContain('limit=10');

      // simulate loadMore
      Object.assign(core.state, { isLoading: false, hasMore: true });
      core.loadMore();

      // verify fetcher called again with higher limit
      expect(mockFetcher).toHaveBeenCalledTimes(2);

      const secondCallUrl = mockFetcher.mock.calls[1][0] as string;
      expect(secondCallUrl).toContain('limit=20'); // 10 + 10
      expect(core.state.isLoading).toBe(true);
    });

    it('should ignore loadMore call if already loading', () => {
      core.handleInput('test');
      Object.assign(core.state, { isLoading: true });

      core.loadMore();

      // verify it didn't trigger an extra fetch
      expect(mockFetcher).not.toHaveBeenCalled();
    });
  });
});
