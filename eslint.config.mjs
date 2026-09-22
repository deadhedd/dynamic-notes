import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import obsidianmd from 'eslint-plugin-obsidianmd';
import { fileURLToPath } from 'node:url';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(
	globalIgnores([
		'node_modules',
		'main.js',
		'main.js.map',
		'esbuild.config.mjs',
		'eslint.config.mjs',
		'versions.json',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mjs', 'scripts/verify-release-metadata.mjs'],
				},
				tsconfigRootDir: rootDirectory,
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ['tests/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			'obsidianmd/no-nodejs-modules': 'off',
		},
	},
	{
		files: ['scripts/verify-release-metadata.mjs'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			'obsidianmd/no-console': 'off',
			'obsidianmd/no-nodejs-modules': 'off',
			'obsidianmd/rule-custom-message': 'off',
		},
	},
);
