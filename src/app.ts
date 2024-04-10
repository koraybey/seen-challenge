import path from 'node:path'

import fastifyAutoload from '@fastify/autoload'
import fastifySensible from '@fastify/sensible'
import Fastify, { FastifyServerOptions } from 'fastify'

const build = async (options?: FastifyServerOptions) => {
    const fastify = Fastify(options)
    // Utility plugin with error constructors and reply interface decorators
    await fastify.register(fastifySensible)
    // Register routes from /routes dir
    await fastify.register(fastifyAutoload, {
        // eslint-disable-next-line unicorn/prefer-module
        dir: path.join(__dirname, 'routes'),
    })
    return fastify
}

export default build
