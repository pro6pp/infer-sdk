# Pro6PP Infer JS SDK

The official Vanilla JS SDK for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters).
A library that adds address autocompletion to any HTML input field.

## Installation

#### Option 1: CDN

Add this script to your HTML file. It exposes a global `Pro6PP` variable.

```html
<script src="https://unpkg.com/@pro6pp/infer-js"></script>
```

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
<script src="path/to/index.global.js"></script>
<script>
  const instance = Pro6PP.attach('#my-input', {
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
  });
</script>
```

## Styling

By default, the SDK injects the necessary CSS for the dropdown. If you want to control the styling with your own styles, set `style: 'none'` in the config:

```js
attach(inputElement, {
  authKey: '...',
  country: 'NL',
  style: 'none', // disables default styles
});
```

You can then target the following classes in your CSS:

| Class                    | Description                                               |
| :----------------------- | :-------------------------------------------------------- |
| `.pro6pp-wrapper`        | The container element wrapping the input and dropdown.    |
| `.pro6pp-input`          | The input element itself.                                 |
| `.pro6pp-dropdown`       | The `<ul>` list containing the suggestions.               |
| `.pro6pp-item`           | A single suggestion item (`<li>`).                        |
| `.pro6pp-item--active`   | The currently highlighted item (for keyboard navigation). |
| `.pro6pp-item__label`    | The main text/label of a suggestion.                      |
| `.pro6pp-item__subtitle` | The secondary text (e.g., city or result count).          |
| `.pro6pp-item__chevron`  | The icon indicating a folder/expandable result.           |
| `.pro6pp-no-results`     | The message shown when no suggestions are found.          |
| `.pro6pp-loader-item`    | The list item containing the loading spinner and text.    |
| `.pro6pp-mini-spinner`   | The spinner icon inside the loader item.                  |
