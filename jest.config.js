export default {
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{js,jsx,tsx,ts}'],
    coverageDirectory: 'coverage',
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/?(*.)+(spec|test).js'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
};
