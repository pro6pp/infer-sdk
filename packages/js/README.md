# Pro6PP Infer JS SDK

The official Vanilla JS SDK for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters).
A library that adds address autocompletion to any HTML input field.

## Installation

### Option 1: CDN

Add this script to your HTML file. It exposes a global `Pro6PP` variable.

```html
<script src="https://unpkg.com/@pro6pp/infer-js"></script>
```

### Option 2: NPM

If you are using a build tool like Webpack or Vite, but not a framework like React.

```bash
npm install @pro6pp/infer-js
```

> **Note:** If you are using React, use [`@pro6pp/infer-react`](https://www.npmjs.com/package/@pro6pp/infer-react) instead.

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
    <script src="https://unpkg.com/@pro6pp/infer-js"></script>
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

1. Create an input field.
2. Import the `attach` function.
3. Initialize the autocomplete on the input.

```html
<label for="address-input">Address</label>
<input id="address-input" name="address" type="text" placeholder="Type address..." />
```

```javascript
import { attach } from '@pro6pp/infer-js';
import '@pro6pp/infer-js/dist/style.css';

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

By default, the SDK injects a small CSS block to make the dropdown look decent. If you want to control the styling with your own CSS, set `style: 'none'` in the config:

```js
attach(inputElement, {
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  style: 'none', // disables default styles
  // ...
});
```

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
  list-style: none;
  padding: 0;
  margin: 0;
}

.pro6pp-item {
  padding: 8px;
  cursor: pointer;
}

.pro6pp-item:hover,
.pro6pp-item.pro6pp-selected {
  background: #f0f0f0;
}
```
