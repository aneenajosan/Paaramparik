process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.JWT_SECRET = 'test-secret-key-for-jest-unit-tests';

// Suppress console logs in tests unless explicitly enabled
if (process.env.DEBUG !== 'true') {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // keep error spy quiet in expected error tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

