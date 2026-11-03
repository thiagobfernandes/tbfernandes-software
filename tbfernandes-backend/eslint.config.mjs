// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // supertest bodies are untyped JSON.
    files: ['test/**/*.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    // Layer rules (docs/backend/arquitetura.md): domain is plain TypeScript, application
    // never reaches persistence or HTTP, and a module uses another only through its lookup.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', 'typeorm', 'express', 'joi'],
              message: 'domain is plain TypeScript.',
            },
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/protocols/**',
                '**/web/**',
              ],
              message: 'domain depends on nothing else.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/*/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'typeorm',
                'express',
                '@nestjs/typeorm',
                '@nestjs/platform-express',
              ],
              message:
                'application talks to interfaces, not to the database or HTTP.',
            },
            {
              group: ['**/infrastructure/**', '**/protocols/**', '**/web/**'],
              message: 'application only depends on domain.',
            },
          ],
        },
      ],
    },
  },
);
