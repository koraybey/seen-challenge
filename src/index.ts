import path, { dirname } from 'node:path'
import { exit } from 'node:process'
import { fileURLToPath } from 'node:url'

import fastifyAutoload from '@fastify/autoload'
import fastifySensible from '@fastify/sensible'
import Fastify from 'fastify'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const f = Fastify({
    logger: true,
})

const start = async () => {
    // Utility plugin with error constructors and reply interface decorators
    await f.register(fastifySensible)

    // Register routes from /routes dir
    await f.register(fastifyAutoload, {
        dir: path.join(__dirname, 'routes'),
    })

    await f.listen({ port: 3000, host: '0.0.0.0' })
}

// eslint-disable-next-line unicorn/prefer-top-level-await
start().catch((error) => {
    f.log.error(error)
    exit(1)
})
