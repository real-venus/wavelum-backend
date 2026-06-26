// jest.setup.js
require('dotenv').config({ path: '.env.test' });

// Set test timeouts
jest.setTimeout(60000);

// Some legacy suites were authored in a mocha/sinon style and reference `sinon`
// as a global without importing it. Expose it globally so they run under Jest.
try {
  global.sinon = require('sinon');
} catch (error) {
  console.warn('sinon not available for global injection:', error.message);
}

// Setup OpenAPI validation for tests
try {
  const jestOpenAPI = require('jest-openapi').default;
  const swaggerSpec = require('./src/swagger/options');
  jestOpenAPI(swaggerSpec);
} catch (error) {
  console.warn('OpenAPI validation setup failed (optional):', error.message);
}
