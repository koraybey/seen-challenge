import { Effect } from 'effect'

import app from './app.js'

export const server = Effect.tryPromise({
    try: () =>
        app({
            logger: {
                level: 'info',
                transport: {
                    target: 'pino-pretty',
                },
            },
        }),
    catch: () => new Error('Cannot build the server.'),
})

await Effect.runPromise(server)
    .then((s) => s.listen({ port: 3000 }))
    .catch(() => new Error('Error while trying to listen to the server.'))
