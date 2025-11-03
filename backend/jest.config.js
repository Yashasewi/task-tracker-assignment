module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "**/*.js",
    "!node_modules/**",
    "!__tests__/**",
    "!jest.config.js",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
