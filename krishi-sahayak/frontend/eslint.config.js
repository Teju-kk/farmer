import js from '@eslint/js';
export default [
  js.configs.recommended,
  { ignores: ['dist'] },
  { files: ['src/**/*.{js,jsx}'], languageOptions: { parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } }, globals: { localStorage: 'readonly', document: 'readonly', window: 'readonly', URL: 'readonly', btoa: 'readonly', setTimeout: 'readonly' } }, rules: { 'no-unused-vars': 'off' } }
];
