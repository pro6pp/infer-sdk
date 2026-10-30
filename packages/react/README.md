# Pro6PP Infer React SDK

A ready-made address autocomplete component for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters), plus a headless `useInfer` hook to build your own.

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

Place suggestions are opt-in. Pass `types="place"` or
`types="address,place"` and handle the selected `PlaceValue` with
`onPlaceSelect`; omitting `types` keeps address-only behavior. Use
`supportsInferPlaces(country)` or `INFER_PLACES_COUNTRIES` to check country
support.

The `useInfer` hook exposes place results through `state.places` and
`state.selectedPlace`, and provides `setPlace(place)` for programmatic
selection. `PlaceValue` includes the place ID, name, category, address fields,
and coordinates.

```tsx
<Pro6PPInfer
  authKey="YOUR_AUTH_KEY"
  country="NL"
  types="address,place"
  onPlaceSelect={(place) => console.log('Selected place:', place)}
/>
```

The component accepts the following props, and forwards its `ref` to the input element:

| Prop                   | Description                                                                                            |
| :--------------------- | :----------------------------------------------------------------------------------------------------- |
| `authKey`              | Your Pro6PP authorization key. Can be omitted when `apiUrl` points to a proxy that adds it.            |
| `country`              | The country to search in, such as `NL` or `DE`. Required.                                              |
| `className`            | Optional CSS class name for the wrapper `div`.                                                         |
| `style`                | Optional inline styles for the wrapper `div`.                                                          |
| `inputProps`           | Attributes for the input; `className` adds to `pro6pp-input`, handlers chain, `value` is ignored.      |
| `disableDefaultStyles` | If `true`, prevents the automatic injection of the default CSS theme.                                  |
| `placeholder`          | Custom placeholder text for the input field.                                                           |
| `noResultsText`        | The text to display when no suggestions are found.                                                     |
| `renderItem`           | A custom render function for suggestion items, receiving the `item` and `isActive` state.              |
| `renderNoResults`      | A custom render function for the empty state, receiving the current `state`.                           |
| `limit`                | Number of suggestions to request per batch, at most `1000`. Defaults to `20`.                          |
| `debounceMs`           | Delay in ms before API search. Defaults to `150` (min `50`).                                           |
| `maxRetries`           | Maximum retries after a network error or a `5xx` or `429` response, `0` to `10`. Defaults to `0`.      |
| `showClearButton`      | If `true`, displays a button to empty the input field. Defaults to `true`.                             |
| `loadingText`          | The text displayed at the bottom of the list when fetching more results.                               |
| `language`             | Language of the labels: `nl`, `fr` or `de`. Only applies to `BE`.                                      |
| `sort`                 | Order of mixed address and place suggestions: `relevance` (default) or `distance` (`infer::location`). |
| `lat`, `lng`           | The origin for `sort="distance"`, else the request IP's location. Provide both.                        |
| `apiUrl`               | The endpoint to call instead of `https://api.pro6pp.nl/v2/infer/{country}`, such as a proxy.           |
| `fetcher`              | A custom `fetch` implementation for the API requests.                                                  |
| `initialValue`         | An `AddressValue` to fill in the input with initially, without calling `onSelect` or `onStateChange`.  |
| `types`                | Optional suggestion sources: `place` or `address,place`; omitted means addresses only.                 |
| `onStateChange`        | Callback receiving the `InferState` whenever it changes.                                               |
| `onSelect`             | Callback receiving a completed `AddressValue` (or its label), or `null` when it is cleared.            |
| `onPlaceSelect`        | Callback receiving the selected `PlaceValue`, or `null` when it is cleared.                            |

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
`getOrderedItems(state)` returns the suggestions in the order that keyboard navigation follows, and `state.selectedSuggestionIndex` is the index of the highlighted one.

```tsx
import React from 'react';
import { getOrderedItems, useInfer } from '@pro6pp/infer-react';

const CustomAddressForm = () => {
  const { state, inputProps, selectItem } = useInfer({
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
    limit: 5,
  });
  const items = getOrderedItems(state);

  return (
    <div className="address-autocomplete">
      <label htmlFor="address">Address</label>

      {/* inputProps contains value, onChange, and onKeyDown */}
      <input
        id="address"
        {...inputProps}
        placeholder="Type an address..."
        className="my-input-class"
      />

      {state.isLoading && <div className="spinner">Loading...</div>}

      {/* render the dropdown */}
      {items.length > 0 && (
        <ul className="my-dropdown-class" role="listbox">
          {items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              role="option"
              aria-selected={index === state.selectedSuggestionIndex}
              className={index === state.selectedSuggestionIndex ? 'active' : undefined}
              onClick={() => selectItem(item)}
            >
              {item.label}
              {item.subtitle && <small>, {item.subtitle}</small>}
            </li>
          ))}
        </ul>
      )}

      {state.isValid && <p>Valid selection made.</p>}
    </div>
  );
};
```

The hook accepts the same search options, callbacks and `initialValue` as the component, and
returns:

| Member              | Description                                                          |
| :------------------ | :------------------------------------------------------------------- |
| `state`             | The current `InferState`: query, suggestions, loading status, etc.   |
| `inputProps`        | The `value`, `onChange` and `onKeyDown` to spread onto an `<input>`. |
| `selectItem(item)`  | Selects a suggestion.                                                |
| `setValue(address)` | Fills in an `AddressValue` programmatically.                         |
| `setPlace(place)`   | Selects a `PlaceValue` programmatically.                             |
| `loadMore()`        | Raises the limit by one batch and fetches the longer list again.     |
| `core`              | The underlying `InferCore` instance.                                 |
