import type { Options } from 'tsup'

const environment = process.env['NODE_ENV']

export const tsup: Options = {
    splitting: true,
    clean: true,
    format: ['esm'],
    minify: environment === 'production',
    bundle: environment === 'production',
    entryPoints: ['src/index.ts'],
    watch: environment === 'development',
    target: 'es2022',
    entry: ['src/**/*.ts'],
}
