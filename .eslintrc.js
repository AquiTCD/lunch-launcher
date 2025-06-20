module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^(Logger|SpreadsheetApp|PropertiesService|UrlFetchApp|Utilities|ContentService)$'
    }],
  },
  globals: {
    Logger: 'readonly',
    SpreadsheetApp: 'readonly',
    PropertiesService: 'readonly',
    UrlFetchApp: 'readonly',
    Utilities: 'readonly',
    ContentService: 'readonly',
  },
};
