import { exit } from 'node:process'

import build from './app.js'

const server = async () => {
    const app = await build({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
            },
        },
    })
    app.listen({ port: 3000 }, (error) => {
        if (error) {
            app.log.error(error)
            exit(1)
        }
    })
    return app
}

server()
    .then((s) => s.listen({ port: 3000 }))
    .catch((error) => {
        if (error) {
            exit(1)
        }
    })
