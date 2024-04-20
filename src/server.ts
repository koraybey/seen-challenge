import { Effect } from 'effect'

import app from './app.js'

export const server = Effect.promise(() =>
    app({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
            },
        },
    })
)

export default Effect.runPromise(server)
    .then((s) => s?.listen({ port: 3000 }))
    .catch(() => new Error('Cannot start the server.'))
