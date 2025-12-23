# Pro6PP Infer Core

The headless logic engine behind the Pro6PP Infer SDKs.
Use this package if you are building a custom integration for a framework, or if you need to run Infer in a non-standard environment.

> **Note:** Use [`@pro6pp/infer-react`](https://www.npmjs.com/package/@pro6pp/infer-react) for React applications. For all other frameworks or Vanilla JS, use [`@pro6pp/infer-js`](https://www.npmjs.com/package/@pro6pp/infer-js).

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
    // suggestions, isLoading, isValid, selectedSuggestionIndex, etc.
    console.log('Current State:', state);
  },
  onSelect: (result) => {
    console.log('User selected:', result);
  },
});

const input = document.querySelector('#my-input');

// pass input events to the core
input.addEventListener('input', (e) => {
  core.handleInput(e.target.value);
});

// pass keyboard events
input.addEventListener('keydown', (e) => {
  core.handleKeyDown(e);
});

// handle clicks
function onSuggestionClick(item) {
  core.selectItem(item);
}
```
