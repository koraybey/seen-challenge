export default async () => {
    return {
        verbose: true,
        extensionsToTreatAsEsm: ['.ts'],
        transformIgnorePatterns: [],
        testEnvironment: 'node',
        moduleNameMapper: {
            '^(\\.{1,2}/.*)\\.js$': '$1',
        },
        testTimeout: 10_000,
    }
}
