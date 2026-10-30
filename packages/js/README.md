# Pro6PP Infer JS SDK

The official Vanilla JS SDK for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters).
A library that adds address autocompletion to any HTML input field.

## Installation

#### Option 1: CDN

Add this script to your HTML file. It exposes a global `Pro6PP` variable.

```html
<script src="https://unpkg.com/@pro6pp/infer-js"></script>
```

The URL loads the latest version. To stay on a version you have tested, add it to the URL: `@pro6pp/infer-js@<version>`.

#### Option 2: NPM

If you are using a build tool like Webpack or Vite, but not a framework like React.

```bash
npm install @pro6pp/infer-js
```

> **Note:** If you are using React, use [`@pro6pp/infer-react`](https://www.npmjs.com/package/@pro6pp/infer-react) instead.

#### Option 3: Direct download

You can also [download](https://unpkg.com/@pro6pp/infer-js@latest/dist/index.global.js) the latest `index.global.js` and place it in your project.

## Usage

#### Option 1: CDN

1. Add the script to your page.
2. Create an input field.
3. Attach the core logic to that input using `Pro6PP.attach()`.

```html
<label>Address:</label>
<input id="address-input" type="text" />

<!-- Inject the CDN -->
<script src="https://unpkg.com/@pro6pp/infer-js"></script>
<script>
  Pro6PP.attach('#address-input', {
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
    onSelect: function (result) {
      console.log('Selected Address:', result);
    },
  });
</script>
```

Place suggestions are opt-in. Pass `types: 'place'` or
`types: 'address,place'` and handle the selected place with `onPlaceSelect`.
The selected place is available as `instance.place`, and an existing
`PlaceValue` can be selected programmatically with `instance.setPlace(place)`.
Omitting `types` keeps address-only behavior. Use
`Pro6PP.supportsInferPlaces(country)` or `Pro6PP.INFER_PLACES_COUNTRIES` to check
country support. `PlaceValue` includes the
place ID, name, category, address fields, and coordinates.

```javascript
const instance = Pro6PP.attach('#address-input', {
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  types: 'address,place',
  onPlaceSelect: (place) => console.log('Selected place:', place),
});
```

#### Option 2: NPM

1. Create an input field.
2. Import the `attach` function.
3. Initialize the autocomplete on the input.

```html
<input id="address-input" name="address" />
```

```javascript
import { attach } from '@pro6pp/infer-js';

const inputElement = document.getElementById('address-input');

attach(inputElement, {
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  // triggered whenever the internal state changes
  onStateChange: function (state) {
    console.log('Current State:', state);
  },
  // triggered when the user selects a final address
  onSelect: function (result) {
    console.log('Selected Address:', result);
  },
});
```

#### Option 3: Direct download

1. [Download](https://unpkg.com/@pro6pp/infer-js@latest/dist/index.global.js) the latest `index.global.js`.
2. Place it in your project and include it directly in your HTML.

```html
<input id="my-input" type="text" />

<script src="path/to/index.global.js"></script>
<script>
  const instance = Pro6PP.attach('#my-input', {
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
  });
</script>
```

## Options

`attach()` accepts the following options:

| Option            | Description                                                                                             |
| :---------------- | :------------------------------------------------------------------------------------------------------ |
| `authKey`         | Your Pro6PP authorization key. Can be omitted when `apiUrl` points to a proxy that adds it.             |
| `country`         | The country to search in, such as `NL` or `DE`. Required.                                               |
| `types`           | Suggestion sources: `place` or `address,place`; omitted means addresses only.                           |
| `limit`           | Number of suggestions to request per batch, at most `1000`. Defaults to `20`.                           |
| `debounceMs`      | Delay in ms before the API search. Defaults to `150` (min `50`).                                        |
| `maxRetries`      | Maximum retries after a network error or a `5xx` or `429` response, `0` to `10`. Defaults to `0`.       |
| `language`        | Language of the labels: `nl`, `fr` or `de`. Only applies to `BE`.                                       |
| `sort`            | Order of mixed address and place suggestions: `relevance` (default) or `distance` (`infer::location`).  |
| `lat`, `lng`      | The origin for `sort: 'distance'`, else the request IP's location. Provide both.                        |
| `apiUrl`          | The endpoint to call instead of `https://api.pro6pp.nl/v2/infer/{country}`, such as a proxy.            |
| `fetcher`         | A custom `fetch` implementation for the API requests.                                                   |
| `style`           | `default` injects the default styles, `none` leaves the styling to you. Defaults to `default`.          |
| `placeholder`     | Placeholder text for the input field.                                                                   |
| `inputClass`      | Space-separated CSS classes to add to the input field.                                                  |
| `noResultsText`   | The text to display when no suggestions are found. Defaults to `No results found`.                      |
| `loadingText`     | The text displayed at the bottom of the list when fetching more results. Defaults to `Loading more...`. |
| `showClearButton` | If `true`, displays a button to empty the input field. Defaults to `true`.                              |
| `onStateChange`   | Callback receiving the `InferState` whenever it changes.                                                |
| `onSelect`        | Callback receiving a completed `AddressValue` (or its label), or `null` when it is cleared.             |
| `onPlaceSelect`   | Callback receiving the selected `PlaceValue`, or `null` when it is cleared.                             |

## Instance

`attach()` returns an instance with the following members:

| Member                     | Description                                                                                             |
| :------------------------- | :------------------------------------------------------------------------------------------------------ |
| `instance.value`           | The selected `AddressValue`, or `null`. Assign an `AddressValue` to fill in the input.                  |
| `instance.place`           | The selected `PlaceValue`, or `null`.                                                                   |
| `instance.setPlace(place)` | Selects a `PlaceValue` programmatically.                                                                |
| `instance.destroy()`       | Removes the listeners and added elements, and clears the input. Re-attaching destroys it automatically. |

## Styling

By default, the SDK injects the necessary CSS for the dropdown. You have several options for styling:

Note: the JavaScript bundle still contains the default CSS as a fallback. Importing `@pro6pp/infer-js/styles.css` with `style: 'none'` disables runtime style injection, but does not provide a CSS-free JS bundle.

### Option 1: Use auto-injected styles (default)

No extra setup needed. The CSS is embedded in the JS bundle and injected automatically.

### Option 2: Import CSS separately

If you prefer to load the CSS as a separate file:

```javascript
import { attach } from '@pro6pp/infer-js';
import '@pro6pp/infer-js/styles.css';

attach(inputElement, {
  authKey: '...',
  country: 'NL',
  style: 'none', // disable auto-injection since we imported CSS separately
});
```

### Option 3: CDN with separate CSS

```html
<link rel="stylesheet" href="https://unpkg.com/@pro6pp/infer-js/dist/styles.css" />
<script src="https://unpkg.com/@pro6pp/infer-js"></script>
<script>
  Pro6PP.attach('#address-input', {
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
    style: 'none', // disable auto-injection since we linked CSS separately
  });
</script>
```

### Option 4: Fully custom styles

If you want to control the styling entirely with your own CSS:

```js
attach(inputElement, {
  authKey: '...',
  country: 'NL',
  style: 'none', // disables default style injection
});
```

You can then target the following classes in your CSS:

| Class                            | Description                                                                |
| :------------------------------- | :------------------------------------------------------------------------- |
| `.pro6pp-wrapper`                | The container element wrapping the input and dropdown.                     |
| `.pro6pp-input`                  | The input element itself.                                                  |
| `.pro6pp-input-addons`           | The container for the controls inside the input, such as the clear button. |
| `.pro6pp-clear-button`           | The button that clears the input.                                          |
| `.pro6pp-dropdown`               | The panel containing the suggestion list and the loader.                   |
| `.pro6pp-list`                   | The `<ul>` list containing the suggestions.                                |
| `.pro6pp-item`                   | A single suggestion item (`<li>`).                                         |
| `.pro6pp-item--active`           | The currently highlighted item (for keyboard navigation).                  |
| `.pro6pp-item--place`            | An item for a point of interest rather than an address.                    |
| `.pro6pp-item--fuzzy`            | An item for a close match rather than an exact one.                        |
| `.pro6pp-item__label`            | The main text/label of a suggestion.                                       |
| `.pro6pp-item__label--match`     | The part of a label that matches the query.                                |
| `.pro6pp-item__label--unmatched` | The rest of the label.                                                     |
| `.pro6pp-item__subtitle`         | The secondary text (e.g., city or result count).                           |
| `.pro6pp-item__chevron`          | The icon indicating a folder/expandable result.                            |
| `.pro6pp-no-results`             | The message shown while searching or when no suggestions are found.        |
| `.pro6pp-loader-item`            | The element containing the loading spinner and text.                       |
| `.pro6pp-mini-spinner`           | The spinner icon inside the loader item.                                   |
