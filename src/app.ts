import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastifyAutoload from '@fastify/autoload'
import fastifySensible from '@fastify/sensible'
import Fastify, { FastifyServerOptions } from 'fastify'

const app = async (
    options?: Readonly<FastifyServerOptions>
): Promise<Fastify.FastifyInstance | undefined> => {
    return await Fastify(options)
        // Register routes from /routes dir

        .register(fastifyAutoload, {
            dir: path.join(dirname(fileURLToPath(import.meta.url)), 'routes'),
        })
        // Utility plugin with error constructors and reply interface decorators

        .register(fastifySensible)
}

export default app
