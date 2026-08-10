import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import obsidianmd from 'eslint-plugin-obsidianmd';

const rootDirectory = new URL('.', import.meta.url).pathname;

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
