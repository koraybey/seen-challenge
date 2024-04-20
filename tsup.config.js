import { defineConfig } from 'tsup'

const environment = process.env['NODE_ENV']

export default defineConfig({
    entryPoints: ['src/index.ts'],
    entry: ['src/**/*.ts', '!src/**/*.mock.*', '!src/**/*.test.*'],
    format: ['esm'],
    target: 'es2022',
    splitting: true,
    clean: true,
    minify: environment === 'production',
    bundle: environment === 'production',
    watch: environment === 'development',
    sourcemap: environment === 'development',
})
