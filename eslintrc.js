module.exports = {
    extends: [
      'react-app',
      'react-app/jest'
    ],
    rules: {
      // Add your custom rules here
    },
    reportUnusedDisableDirectives: process.env.CI ? 'warn' : 'error',
  };
  