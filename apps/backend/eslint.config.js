// ESLint 9 flat config (replaces .eslintrc.js). Formatting is left to Prettier (`pnpm format`), not enforced by lint.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'uploads/**', 'eslint.config.js'] },
  {
    files: ['{src,test}/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module' },
      globals: {
        process: 'readonly', Buffer: 'readonly', __dirname: 'readonly', console: 'readonly', module: 'readonly', require: 'readonly',
        describe: 'readonly', it: 'readonly', expect: 'readonly', jest: 'readonly', beforeEach: 'readonly', afterEach: 'readonly',
        beforeAll: 'readonly', afterAll: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', Express: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/consistent-type-assertions': 'error',
      'no-console': 'warn',
      eqeqeq: ['error', 'smart'],
      'guard-for-in': 'warn',
      'new-parens': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-eval': 'error',
      'no-throw-literal': 'error',
    },
  },
];
