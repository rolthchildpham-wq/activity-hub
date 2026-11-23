// ESLint 9 flat config for targeted TOPKEY modules (no rewriting legacy code).
export default [
  {
    files: ['../sport-dashboard-h201.js', '../sports/vnext/src/dashboard-truth-h202.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: { window: 'readonly', document: 'readonly', requestAnimationFrame: 'readonly', MutationObserver: 'readonly' } },
    rules: {
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-unsafe-finally': 'error',
      'no-dupe-args': 'error',
      'no-unused-vars': 'warn'
    }
  }
];
