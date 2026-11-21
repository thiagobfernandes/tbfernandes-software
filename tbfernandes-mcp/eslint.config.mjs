// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Same clean code rules as the backend (docs/padroes-de-codigo.md#clean-code).
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'id-length': [
        'error',
        { min: 2, properties: 'never', exceptions: ['_'] },
      ],
      '@typescript-eslint/no-shadow': 'error',
      'no-nested-ternary': 'error',
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
    },
  },
);
