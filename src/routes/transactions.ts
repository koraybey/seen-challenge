import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { getTransactionsData } from '../data/transactions.js'
import {
    aggregatedTransactionsArraySchema,
    customerId,
    Transaction,
} from '../schema.js'

const getTransactionsByCustomerId: FastifyPluginAsync = async (server) => {
    await Promise.all([
        server.get<{
            Reply: Transaction[]
            Params: { customerId: z.infer<typeof customerId> }
        }>('/transactions/:customerId', {
            schema: {
                response: {
                    200: zodToJsonSchema(aggregatedTransactionsArraySchema),
                },
            },
            handler: onGetTransactions,
        }),
        server.get<{
            Reply: Transaction[]
            Params: { customerId: z.infer<typeof customerId> }
        }>('/transactions', {
            handler: onGetTransactions,
        }),
    ])
}

const onGetTransactions = async (
    request: FastifyRequest<{
        Params: { customerId?: z.infer<typeof customerId> }
    }>,
    reply: FastifyReply
) => {
    const transactions = await getTransactionsData(request.params.customerId)
    if (!transactions) {
        return reply.internalServerError()
    }
    void reply.send(transactions)
}

export default getTransactionsByCustomerId
