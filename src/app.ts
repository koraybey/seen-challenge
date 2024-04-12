import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastifyAutoload from '@fastify/autoload'
import fastifySensible from '@fastify/sensible'
import Fastify, { FastifyServerOptions } from 'fastify'

const app = async (options?: FastifyServerOptions) => {
    const fastify = Fastify(options)
    // Utility plugin with error constructors and reply interface decorators
    await fastify.register(fastifySensible)
    // Register routes from /routes dir
    await fastify.register(fastifyAutoload, {
        dir: path.join(dirname(fileURLToPath(import.meta.url)), 'routes'),
    })
    return fastify
}

export default app
