# Pro6PP Infer Core

The headless logic engine behind the Pro6PP Infer SDKs.
Use this package if you are building a custom integration for a framework, or if you need to run Infer in a non-standard environment.

> **Note:** Use **`@pro6pp/infer-react`** for React applications. For all other frameworks or Vanilla JS, use **`@pro6pp/infer-js`**.

## Installation

```bash
npm install @pro6pp/infer-core
```

## Usage

The core logic is exposed via the `InferCore` class. It manages the API requests, state and parses input.

```typescript
import { InferCore } from '@pro6pp/infer-core';

const core = new InferCore({
  authKey: 'YOUR_AUTH_KEY',
  country: 'NL',
  onStateChange: (state) => {
    console.log('Current Suggestions:', state.suggestions);
    console.log('Is Loading:', state.isLoading);
  },
  onSelect: (result) => {
    console.log('User selected:', result);
  },
});

// feed it input events, e.g. via an <input>
core.handleInput('Amsterdam');

// handle selections when user clicks a suggestion in your dropdown
core.selectItem(suggestionObject);
```
