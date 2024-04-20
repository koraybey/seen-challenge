module.exports = {
    root: true,
    env: {
        node: true,
    },
    plugins: [
        'functional',
        'simple-import-sort',
        'unused-imports',
        'promise',
        'prefer-arrow-functions',
    ],
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
                'plugin:functional/external-typescript-recommended',
                'plugin:functional/recommended',
                'plugin:functional/no-other-paradigms',
                'plugin:functional/stylistic',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
        },
        {
            env: {
                jest: true,
            },
            files: ['src/**/*.mock.*', 'src/**/*.test.*'],
            extends: ['plugin:jest/recommended'],
            rules: {
                'functional/no-expression-statements': 'off',
                'functional/no-return-void': 'off',
                'jest/expect-expect': 'off',
            },
        },
    ],
    ignorePatterns: ['dist', 'lib'],
    rules: {
        'unicorn/no-array-callback-reference': 'off',
        'unicorn/prefer-top-level-await': 'off',
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
        quotes: [
            'error',
            'single',
            {
                avoidEscape: true,
            },
        ],
    },
}
