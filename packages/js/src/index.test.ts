import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { fireEvent, waitFor, getByText } from '@testing-library/dom';
import { InferJS } from './index';

// find elements where the text might be split across multiple children (like <strong> tags)
const matchText = (text: string) => (_content: string, element: Element | null) =>
  element?.textContent === text;

describe('Infer JS', () => {
  let mockFetcher: Mock;
  let container: HTMLElement;
  let input: HTMLInputElement;
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;

  beforeEach(() => {
    vi.useFakeTimers();

    global.IntersectionObserver = class IntersectionObserver {
      constructor(cb: any) {
        observerCallback = cb;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;

    container = document.createElement('div');
    container.innerHTML = `
      <form>
        <label for="address">Address</label>
        <input id="address" type="text" placeholder="Type address..." />
      </form>
    `;
    document.body.appendChild(container);
    input = container.querySelector('input') as HTMLInputElement;

    mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [], cities: [], streets: [] }),
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should attach to the input element', () => {
    const infer = new InferJS(input, { authKey: 'test', country: 'NL', fetcher: mockFetcher });
    expect(infer).toBeDefined();
  });

  it('should fetch results and render suggestions on input', async () => {
    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [{ label: 'Amsterdam' }, { label: 'Rotterdam' }],
      }),
    });

    new InferJS(input, { authKey: 'test', country: 'NL', fetcher: mockFetcher });

    fireEvent.input(input, { target: { value: 'Ams' } });

    vi.advanceTimersByTime(150);

    await waitFor(() => {
      const items = container.querySelectorAll('.pro6pp-item');
      expect(items.length).toBe(2);
    });

    expect(getByText(container, matchText('Amsterdam'))).toBeDefined();
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('should keep dropdown open and append comma for partial selections', async () => {
    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({
        stage: 'city',
        suggestions: [{ label: 'Utrecht' }],
      }),
    });

    new InferJS(input, { authKey: 'test', country: 'NL', fetcher: mockFetcher });

    fireEvent.input(input, { target: { value: 'Utr' } });
    vi.advanceTimersByTime(150);

    const item = await waitFor(() => getByText(container, matchText('Utrecht')));

    fireEvent.click(item);

    expect(input.value).toBe('Utrecht, ');

    const dropdown = container.querySelector('.pro6pp-dropdown') as HTMLElement;
    expect(dropdown.style.display).toBe('block');
  });

  it('should handle keyboard navigation (Arrow Down)', async () => {
    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [{ label: 'A' }, { label: 'B' }],
      }),
    });

    new InferJS(input, { authKey: 'test', country: 'NL', fetcher: mockFetcher });

    fireEvent.input(input, { target: { value: 'test' } });
    vi.advanceTimersByTime(150);

    await waitFor(() => getByText(container, matchText('A')));

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      const items = container.querySelectorAll('.pro6pp-item');
      expect(items[0].classList.contains('pro6pp-item--active')).toBe(true);
    });
  });

  it('should trigger loadMore when scrolling to bottom', async () => {
    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [{ label: 'A' }],
      }),
    });

    const infer = new InferJS(input, { authKey: 'test', country: 'NL', fetcher: mockFetcher });

    // trigger input
    fireEvent.input(input, { target: { value: 'test' } });
    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(container.querySelectorAll('.pro6pp-item').length).toBe(1);
    });

    // simulate more results
    Object.assign(infer['core'].state, { hasMore: true, isLoading: false });

    // trigger observer manually
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);

    // check fetcher was called a 2nd time
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});
