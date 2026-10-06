import baseConfig from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import globals from 'globals';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          // typescript-eslint v8 changed the default to 'all'; keep the pre-upgrade behavior
          caughtErrors: 'none',
        },
      ],
      // `no-empty-interface` was removed in typescript-eslint v8; `no-empty-object-type` is its successor
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
