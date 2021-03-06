/* eslint-disable no-undef */
module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        "./src/**/*.ts",
        "!./src/index.ts"
    ],
    coverageDirectory: "./coverage/",
    coverageThreshold: {
        "global": {
            "branches": 100,
            "functions": 100,
            "lines": 100,
            "statements": 100
        }
    },
    preset: "ts-jest",
    testEnvironment: "node",
};
