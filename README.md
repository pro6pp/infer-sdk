# Pro6PP Infer SDK

[![npm version](https://img.shields.io/npm/v/@pro6pp/infer-js?color=yellow&label=@pro6pp/infer-js&logo=javascript)](https://www.npmjs.com/package/@pro6pp/infer-js)
[![npm version](https://img.shields.io/npm/v/@pro6pp/infer-react?color=blue&label=@pro6pp/infer-react&logo=react)](https://www.npmjs.com/package/@pro6pp/infer-react)
[![npm version](https://img.shields.io/npm/v/@pro6pp/infer-core?color=purple&label=@pro6pp/infer-core)](https://www.npmjs.com/package/@pro6pp/infer-core)
[![License](https://img.shields.io/npm/l/@pro6pp/infer-react)](https://github.com/pro6pp/infer-sdk/blob/main/LICENSE)

This repository contains the source code for the SDKs of the Pro6PP Infer API.
Explore the Infer API documentation [here](https://www.pro6pp.com/developer/infer/nl/parameters).

## Packages

| Package                                     | Installation                                                               |
| :------------------------------------------ | :------------------------------------------------------------------------- |
| **[@pro6pp/infer-js](./packages/js)**       | `npm i @pro6pp/infer-js` or [CDN Link](https://unpkg.com/@pro6pp/infer-js) |
| **[@pro6pp/infer-react](./packages/react)** | `npm i @pro6pp/infer-react`                                                |
| **[@pro6pp/infer-core](./packages/core)**   | `npm i @pro6pp/infer-core`                                                 |

## Development

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

Format all packages:

```bash
npm run format
```

### Running Tests

Run tests for a specific package:

```bash
npm test -w @pro6pp/infer-core
npm test -w @pro6pp/infer-react
npm test -w @pro6pp/infer-js
```

Run tests with coverage:

```bash
npm run test:coverage --workspaces
```

### Release Process

[Changesets](https://github.com/changesets/changesets) is used to manage versions and changelogs.

1.  Create a changeset:

    ```bash
    npm run changeset
    ```

    - Select the packages you modified.
    - Choose the bump type (Major/Minor/Patch).
    - Write a summary of the changes.

2.  Release:

    ```bash
    # bump versions and update changelogs
    npm run changeset version

    # commit version bumps and changeset
    git add .
    git commit -m "chore: release version"

    # pushes to main will publish to NPM
    git push
    ```

## License

MIT © [Pro6PP](https://github.com/pro6pp/infer-sdk/blob/main/LICENSE)
