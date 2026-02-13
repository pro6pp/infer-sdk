# Pro6PP Infer React SDK

React Hook for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters).
A headless library to build custom address autocomplete components in React.

## Installation

```bash
npm install @pro6pp/infer-react
```

## Usage

The `Pro6PPInfer` component provides a styled address autocomplete input.

```tsx
import React from 'react';
import { Pro6PPInfer } from '@pro6pp/infer-react';

const AddressForm = () => {
  return (
    <div className="form-group">
      <label>Search Address</label>
      <Pro6PPInfer
        authKey="YOUR_AUTH_KEY"
        country="NL"
        onSelect={(selection) => console.log('Selected:', selection)}
        placeholder="Type a Dutch address..."
      />
    </div>
  );
};
```

You can customize the appearance of the component via the following props:

| Prop                   | Description                                                                               |
| :--------------------- | :---------------------------------------------------------------------------------------- |
| `className`            | Optional CSS class name for the wrapper `div`.                                            |
| `disableDefaultStyles` | If `true`, prevents the automatic injection of the default CSS theme.                     |
| `placeholder`          | Custom placeholder text for the input field.                                              |
| `noResultsText`        | The text to display when no suggestions are found.                                        |
| `renderItem`           | A custom render function for suggestion items, receiving the `item` and `isActive` state. |
| `renderNoResults`      | A custom render function for the empty state, receiving the current `state`.              |
| `debounceMs`           | Delay in ms before API search. Defaults to `150` (min `50`).                              |
| `maxRetries`           | Maximum retry attempts for transient network errors. Valid range: `0` to `10`.            |
| `showClearButton`      | If `true`, displays a button to empty the input field. Defaults to `true`.                |
| `loadingText`          | The text displayed at the bottom of the list when fetching more results.                  |

## Styling

By default, the component auto-injects the necessary CSS. You have several options:

### Option 1: Use auto-injected styles (default)

No extra setup needed. The CSS is embedded and injected automatically.

### Option 2: Import CSS separately

If you prefer to import the CSS file directly:

```tsx
import { Pro6PPInfer } from '@pro6pp/infer-react';
import '@pro6pp/infer-react/styles.css';

<Pro6PPInfer
  authKey="..."
  country="NL"
  disableDefaultStyles // disable auto-injection since we imported the CSS
/>;
```

### Option 3: Fully custom styles

Set `disableDefaultStyles` and provide your own CSS targeting the `.pro6pp-*` classes:

```tsx
<Pro6PPInfer authKey="..." country="NL" disableDefaultStyles className="my-custom-wrapper" />
```

---

Alternatively, you can use the headless `useInfer` hook.
This hook handles all the logic (state, API calls, debouncing, keyboard navigation), but allows you to build your own custom UI.

```tsx
import React from 'react';
import { useInfer } from '@pro6pp/infer-react';

const CustomAddressForm = () => {
  const { state, inputProps, selectItem } = useInfer({
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
    limit: 5,
  });

  return (
    <div className="address-autocomplete">
      <label>Address</label>

      {/* inputProps contains value, onChange, and onKeyDown */}
      <input {...inputProps} placeholder="Type an address..." className="my-input-class" />

      {state.isLoading && <div className="spinner">Loading...</div>}

      {/* render the dropdown */}
      {(state.suggestions.length > 0 || state.cities.length > 0) && (
        <ul className="my-dropdown-class">
          {/* render cities */}
          {state.cities.map((city, i) => (
            <li key={`city-${i}`} onClick={() => selectItem(city)}>
              <strong>{city.label}</strong> (City)
            </li>
          ))}

          {/* render streets */}
          {state.streets.map((street, i) => (
            <li key={`street-${i}`} onClick={() => selectItem(street)}>
              <strong>{street.label}</strong> (Street)
            </li>
          ))}

          {/* render general suggestions */}
          {state.suggestions.map((item, i) => (
            <li key={`suggestion-${i}`} onClick={() => selectItem(item)}>
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {state.isValid && <p>Valid address selected.</p>}
    </div>
  );
};
```
