module.exports = {
    verbose: true,
    extensionsToTreatAsEsm: ['.ts'],
    transformIgnorePatterns: [],
    testEnvironment: 'node',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
}
