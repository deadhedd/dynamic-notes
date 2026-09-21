import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import obsidianmd from 'eslint-plugin-obsidianmd';
import { fileURLToPath } from 'node:url';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(
	globalIgnores([
		'node_modules',
		'tests',
		'main.js',
		'main.js.map',
		'esbuild.config.mjs',
		'versions.json',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mjs'],
				},
				tsconfigRootDir: rootDirectory,
			},
		},
	},
	...obsidianmd.configs.recommended,
);
