# Pro6PP Infer SDK

This repository contains the source code for the SDKs of the Pro6PP Infer API.
For more details, visit the [API Documentation](https://www.pro6pp.com/developer/infer/nl/parameters).

## Packages

Choose the package that fits your environment:

| Package                                     |                                 | Version                     |
| :------------------------------------------ | :------------------------------ | :-------------------------- |
| **[@pro6pp/infer-core](./packages/core)**   | Shared logic and state machine. | `npm i @pro6pp/infer-core`  |
| **[@pro6pp/infer-react](./packages/react)** | Hook for React applications.    | `npm i @pro6pp/infer-react` |
| **[@pro6pp/infer-js](./packages/js)**       | Drop-in script for vanilla JS.  | `<script src="...">`        |

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
