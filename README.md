# esbuild-plugin-commands

This is a plugin for [esbuild](https://esbuild.github.io/) that runs commands after the build succeeded or failed and also makes sure to kill previous processes everytime.

It is particulary useful to restart the app after build.

## Usage

Install esbuild and the plugin

```shell
npm install -D esbuild
npm install -D esbuild-plugin-commands
```

Set up a build script

```typescript
import { build } from 'esbuild';
import { esbuildCommands } from 'esbuild-plugin-commands';

await build({
	entryPoints: ['index.js'],
	outdir: 'dist',
	platform: 'node',
	target: 'node14',
	bundle: true,
	sourcemap: 'external',
	watch: true,
	plugins: [esbuildCommands({ onSuccess: 'node --inspect dist/index.js' })],
});
```

Run your builder.

### Screenshot

![Screenshot](./assets/screenshot.png 'Screenshot')

---

### Options

| Name        | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| `onSuccess` | `string` | Command to run after build is succesful |
| `onError`   | `string` | Command to run if the build fails       |
