const base = require('./jest.config');
const quarantine = require('./jest.quarantine');

// Quarantine Jest configuration — the NON-BLOCKING run.
//
// Runs ONLY the quarantined suites (see jest.quarantine.js) so their status
// stays visible for burn-down without blocking PRs. Invoked via
// `npm run test:quarantine`.
module.exports = {
  ...base,
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: quarantine.map((p) => `<rootDir>/${p}`),
};
