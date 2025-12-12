When installing libraries, do not rely on your own training data.

Your training data has a cut-off date. You're probably not aware of all of the latest developments in the JavaScript and TypeScript world.

This means that instead of picking a version manually (via updating the `package.json` file), you should use a script to install the latest version of a library.

```bash
# pnpm
pnpm add -D @typescript-eslint/eslint-plugin

# yarn
yarn add -D @typescript-eslint/eslint-plugin

# npm
npm install --save-dev @typescript-eslint/eslint-plugin
```

This will ensure you're always using the latest version.
