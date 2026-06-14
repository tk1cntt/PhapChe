/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'next/typescript',
  ],
  rules: {
    // Component naming rules
    // Custom rule to warn on duplicate/generic component names
    'no-duplicate-component': 'warn',

    // React rules
    'react/display-name': 'off',
    'react/prop-types': 'off', // Using TypeScript

    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

    // Import rules
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],

    // Other helpful rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      rules: {
        // Additional JSX-specific rules can go here
      },
    },
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      rules: {
        // Relax rules for test files
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
