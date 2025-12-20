# @pro6pp/infer-js

The official Vanilla JS SDK for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters).
A library that adds address autocompletion to any HTML input field.

## Installation

### Option 1: CDN

Simply add this script to your HTML file. It exposes a global `Pro6PP` variable.

```html
// TODO: add CDN src
<script src=""></script>
```

### Option 2: NPM

If you are using Webpack, Vite, or Rollup but not a framework like React.

```bash
npm install @pro6pp/infer-js
```

> **Note:** If you are using React, use [`@pro6pp/infer-react`](../react) instead.

## Usage

### Option 1: CDN

1. Add the script to your page.
2. Create an input field.
3. Attach the core logic to that input using `Pro6PP.attach()`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Address Autocomplete</title>
  </head>
  <body>
    <label>Address:</label>
    // TODO: add CDN src
    <script src=""></script>

    <script>
      Pro6PP.attach('#my-address-input', {
        authKey: 'YOUR_AUTH_KEY',
        country: 'NL',
        onSelect: function (result) {
          console.log('Selected Address:', result);
        },
      });
    </script>
  </body>
</html>
```

### Option 2: NPM

```javascript
import { attach } from '@pro6pp/infer-js';

// attach to an input element directly
const inputElement = document.querySelector('input[name="address"]');

attach(inputElement, {
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  onSelect: (result) => {
    console.log(result);
  },
});
```

## Styling

By default, the SDK injects a small CSS block to make the dropdown look decent. If you want to control the styling with your own CSS, set `style: 'none'` in the config.

HTML created by the SDK:

```html
<div class="pro6pp-autocomplete-wrapper">
  <input ... />
  <ul class="pro6pp-results">
    <li class="pro6pp-item">Suggestion 1</li>
    <li class="pro6pp-item pro6pp-selected">Suggestion 2</li>
  </ul>
</div>
```

You can target these classes in your CSS:

```css
.pro6pp-results {
  background: white;
  border: 1px solid #ccc;
}

.pro6pp-item:hover {
  background: #f0f0f0;
}
```
