module.exports = {
    preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
    transform: {
      '^.+\\.vue$': '@vue/vue3-jest',
      '^.+\\.tsx?$': 'ts-jest'
    },
    testEnvironment: 'jest-environment-jsdom',
    testEnvironmentOptions: {
        customExportConditions: ["node", "node-addons"],
     },
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.json'
      }
    }
  };