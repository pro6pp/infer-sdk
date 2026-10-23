# Pro6PP Infer Core

The headless logic engine behind the Pro6PP Infer SDKs.
Use this package if you are building a custom integration for a framework, or if you need to run Infer in a non-standard environment.

> **Note:** Use [`@pro6pp/infer-react`](https://www.npmjs.com/package/@pro6pp/infer-react) for React applications. For all other frameworks or Vanilla JS, use [`@pro6pp/infer-js`](https://www.npmjs.com/package/@pro6pp/infer-js).

## Installation

### Package Manager

```bash
npm install @pro6pp/infer-core
```

### CDN

You can also load the Core SDK directly in the browser via a CDN:

```html
<script src="https://unpkg.com/@pro6pp/infer-core"></script>
```

```html
<script src="https://cdn.jsdelivr.net/npm/@pro6pp/infer-core"></script>
```

These URLs load the latest version. To stay on a version you have tested, add it to the URL: `@pro6pp/infer-core@<version>`.

When loaded via a script tag, the library is available through the global `Pro6PPCore` object.

## Usage

The core logic is exposed via the `InferCore` class. It manages the API requests, state and parses input.

### Using ES Modules

```typescript
import { InferCore } from '@pro6pp/infer-core';

const core = new InferCore({
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  onStateChange: (state) => {
    // suggestions, isLoading, isValid, value, selectedSuggestionIndex, etc.
    console.log('Current State:', state);
  },
  onSelect: (result) => {
    console.log('User selected:', result);
  },
});
```

Place suggestions are opt-in. Set `types` to `place` or `address,place`.
Results are available in `state.places`, and the selected value in
`state.selectedPlace`; use `onPlaceSelect` for selection events. Leaving
`types` unset keeps the address-only request and response behavior. Use
`supportsInferPlaces(country)` or `INFER_PLACES_COUNTRIES` to check country
support. The exported `PlaceValue` type contains the place ID, name, category,
address fields, and coordinates.

```typescript
const core = new InferCore({
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  types: 'address,place',
  onPlaceSelect: (place) => console.log('Selected place:', place),
});
```

### Using via script tag (global)

```javascript
const core = new Pro6PPCore.InferCore({
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  onSelect: (result) => console.log(result),
});
```

### Event handling

Once initialized, pass your input and keyboard events to the core instance to manage state.

```typescript
import type { InferResult } from '@pro6pp/infer-core';

const input = document.querySelector<HTMLInputElement>('#my-input')!;

// pass input events to the core
input.addEventListener('input', () => {
  core.handleInput(input.value);
});

// pass keyboard events
input.addEventListener('keydown', (e) => {
  core.handleKeyDown(e);
});

// handle clicks
function onSuggestionClick(item: InferResult) {
  core.selectItem(item);
}
```

### Options

| Option          | Description                                                                                            |
| :-------------- | :----------------------------------------------------------------------------------------------------- |
| `authKey`       | Your Pro6PP authorization key. Can be omitted when `apiUrl` points to a proxy that adds it.            |
| `country`       | The country to search in, such as `NL` or `DE`. Required.                                              |
| `types`         | Suggestion sources: `place` or `address,place`; omitted means addresses only.                          |
| `limit`         | Number of suggestions to request per batch, at most `1000`. Defaults to `20`.                          |
| `debounceMs`    | Delay in ms before the API search. Defaults to `150` (min `50`).                                       |
| `maxRetries`    | Maximum retries after a network error or a `5xx` or `429` response, `0` to `10`. Defaults to `0`.      |
| `language`      | Language of the labels: `nl`, `fr` or `de`. Only applies to `BE`.                                      |
| `sort`          | Order of mixed address and place suggestions: `relevance` (default) or `distance` (`infer::location`). |
| `lat`, `lng`    | The origin for `sort: 'distance'`, else the request IP's location. Provide both.                       |
| `apiUrl`        | The endpoint to call instead of `https://api.pro6pp.nl/v2/infer/{country}`, such as a proxy.           |
| `fetcher`       | A custom `fetch` implementation for the API requests.                                                  |
| `onStateChange` | Callback receiving the `InferState` whenever it changes.                                               |
| `onSelect`      | Callback receiving a completed `AddressValue` (or its label), or `null` when it is cleared.            |
| `onPlaceSelect` | Callback receiving the selected `PlaceValue`, or `null` when it is cleared.                            |

### Methods

| Method               | Description                                                           |
| :------------------- | :-------------------------------------------------------------------- |
| `handleInput(value)` | Processes new input text and searches after the debounce delay.       |
| `handleKeyDown(e)`   | Handles arrow key navigation and selection with `Enter`.              |
| `selectItem(item)`   | Selects a suggestion.                                                 |
| `loadMore()`         | Raises the limit by one batch and fetches the longer list again.      |
| `destroy()`          | Cancels the pending search and request. Call it when removing the UI. |
