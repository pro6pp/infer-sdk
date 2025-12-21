import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { fireEvent, waitFor, getByText } from '@testing-library/dom';
import { InferJS } from './index';

describe('Infer JS', () => {
  let mockFetcher: Mock;
  let container: HTMLElement;
  let input: HTMLInputElement;

  beforeEach(() => {
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

    await waitFor(() => {
      const list = container.querySelector('.pro6pp-dropdown');
      expect(list).not.toBeNull();
      expect(list?.children.length).toBe(2);
    });

    expect(getByText(container, 'Amsterdam')).toBeDefined();
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('should fill input when a suggestion is clicked', async () => {
    mockFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [{ label: 'Utrecht' }],
      }),
    });

    new InferJS(input, { authKey: 'test', country: 'NL', fetcher: mockFetcher });

    fireEvent.input(input, { target: { value: 'Utr' } });
    const item = await waitFor(() => getByText(container, 'Utrecht'));

    fireEvent.click(item);

    expect(input.value).toBe('Utrecht, ');

    // check list visibility
    await waitFor(() => {
      const list = container.querySelector('.pro6pp-dropdown') as HTMLElement;
      if (list) {
        expect(list.style.display).toBe('none');
      }
    });
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
    await waitFor(() => getByText(container, 'A'));

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      const items = container.querySelectorAll('.pro6pp-item');
      expect(items[0].classList.contains('pro6pp-item--active')).toBe(true);
    });
  });
});
