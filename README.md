# Pro6PP Infer SDK

[![npm version](https://img.shields.io/npm/v/@pro6pp/infer-js?color=yellow&label=@pro6pp/infer-js&logo=javascript)](https://www.npmjs.com/package/@pro6pp/infer-js)
[![npm version](https://img.shields.io/npm/v/@pro6pp/infer-react?color=blue&label=@pro6pp/infer-react&logo=react)](https://www.npmjs.com/package/@pro6pp/infer-react)
[![npm version](https://img.shields.io/npm/v/@pro6pp/infer-core?color=purple&label=@pro6pp/infer-core)](https://www.npmjs.com/package/@pro6pp/infer-core)
[![License](https://img.shields.io/npm/l/@pro6pp/infer-react)](https://github.com/pro6pp/infer-sdk/blob/main/LICENSE)

This repository contains the source code for the SDKs of the Pro6PP Infer API.
For more details, visit the [API Documentation](https://www.pro6pp.com/developer/infer/nl/parameters).

## Packages

Choose the package that fits your environment:

| Package                                     |                                 | Version                     |
| :------------------------------------------ | :------------------------------ | :-------------------------- |
| **[@pro6pp/infer-js](./packages/js)**       | Drop-in script for vanilla JS.  | `<script src="...">`        |
| **[@pro6pp/infer-react](./packages/react)** | Hook for React applications.    | `npm i @pro6pp/infer-react` |
| **[@pro6pp/infer-core](./packages/core)**   | Shared logic and state machine. | `npm i @pro6pp/infer-core`  |

## Development

This repository is a monorepo managed by NPM Workspaces.

### Installation

Clone the repo and install dependencies for all packages at once:

```bash
npm install
```

### Building

Build all packages:

```bash
npm run build
```

### Formatting

We use Prettier for consistent code style across all packages.

```bash
npx prettier --write .
```

## License

MIT © [Pro6PP](https://github.com/pro6pp/infer-sdk/blob/main/LICENSE)
