# @pro6pp/infer-react

React Hook for the [Pro6PP Infer API](https://www.pro6pp.com/developer/infer/nl/parameters).
A headless library to build custom address autocomplete components in React.

## Installation

```bash
npm install @pro6pp/infer-react
```

## Usage

This library handles all the logic (state, API calls, debouncing) but doesn't render anything. You are responsible for rendering the input and the dropdown list using your own styling.

```tsx
import React from 'react';
import { useInfer } from '@pro6pp/infer-react';

const AddressForm = () => {
  const { state, inputProps, selectItem } = useInfer({
    authKey: 'YOUR_AUTH_KEY',
    country: 'NL',
    limit: 5,
  });

  return (
    <div className="address-autocomplete">
      <label>Address</label>

      <input {...inputProps} placeholder="Type a Dutch address..." className="my-input-class" />

      {/* render the dropdown */}
      {(state.suggestions.length > 0 || state.cities.length > 0) && (
        <ul className="my-dropdown-class">
          {/* render cities, if any */}
          {state.cities.map((city, i) => (
            <li key={`city-${i}`} onClick={() => selectItem(city)}>
              <strong>{city.label}</strong> (City)
            </li>
          ))}

          {/* render streets, if any */}
          {state.streets.map((street, i) => (
            <li key={`street-${i}`} onClick={() => selectItem(street)}>
              <strong>{street.label}</strong> (Street)
            </li>
          ))}

          {/* render general suggestions */}
          {state.suggestions.map((item, i) => (
            <li key={`sugg-${i}`} onClick={() => selectItem(item)}>
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {state.isValid && <p>Valid address selected</p>}
    </div>
  );
};
```
