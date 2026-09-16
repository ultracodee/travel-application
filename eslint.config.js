import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
	{
		ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'coverage/**', 'node_modules/**', '.npm-cache/**']
	},
	{
		files: ['**/*.{js,ts,svelte}'],
		languageOptions: {
			globals: {
				console: 'readonly',
				fetch: 'readonly',
				window: 'readonly',
				document: 'readonly',
				ResizeObserver: 'readonly',
				HTMLDivElement: 'readonly',
				RequestInfo: 'readonly',
				URLSearchParams: 'readonly',
				URL: 'readonly',
				Response: 'readonly',
				confirm: 'readonly'
			}
		},
		rules: {
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'@typescript-eslint/no-explicit-any': 'error',
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	}
);
