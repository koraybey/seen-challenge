module.exports = {
    root: true,
    env: {
        node: true,
    },
    plugins: [
        '@typescript-eslint',
        'functional',
        'simple-import-sort',
        'unused-imports',
        'promise',
        'prefer-arrow-functions',
    ],
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:unicorn/recommended',
        'plugin:functional/recommended',
        'plugin:functional/no-other-paradigms',
        'plugin:functional/stylistic',
        'plugin:functional/disable-type-checked',
        'plugin:security/recommended-legacy',
        'plugin:promise/recommended',
        'plugin:prettier/recommended',
    ],
    overrides: [
        {
            files: ['*.ts'],
            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
            ],
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
        },
    ],
    ignorePatterns: ['dist', 'lib'],
    rules: {
        'functional/functional-parameters': 'off',
        'prefer-template': 'error',
        'no-console': 'error',
        'object-shorthand': 'error',
        'simple-import-sort/imports': 'error',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'error',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
        'prefer-arrow-functions/prefer-arrow-functions': [
            'warn',
            {
                allowNamedFunctions: false,
                classPropertiesAllowed: false,
                disallowPrototype: false,
                returnStyle: 'unchanged',
                singleReturnOnly: false,
            },
        ],
        eqeqeq: ['error', 'smart'],
        quotes: ['error', 'single', { avoidEscape: true }],
    },
}
