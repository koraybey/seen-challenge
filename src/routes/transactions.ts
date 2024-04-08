import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { getAggregatedTransactions } from '../data/transactions.js'
import {
    aggregatedTransactionsArraySchema,
    customerId,
    Transaction,
} from '../schema.js'

const getTransactionsByCustomerId: FastifyPluginAsync = async (f) => {
    await Promise.all([
        f.get<{
            Reply: Transaction[]
            Params: { customerId: z.infer<typeof customerId> }
        }>('/transactions/:customerId', {
            schema: {
                response: {
                    200: zodToJsonSchema(aggregatedTransactionsArraySchema),
                },
            },
            handler: onGetTransactionsByCustomerId,
        }),
        f.get<{
            Reply: Transaction[]
            Params: { customerId: z.infer<typeof customerId> }
        }>('/transactions', {
            handler: onGetTransactionsByCustomerId2,
        }),
    ])
}

const onGetTransactionsByCustomerId = async (
    request: FastifyRequest<{
        Params: { customerId?: z.infer<typeof customerId> }
    }>,
    reply: FastifyReply
) => {
    const aggregatedTransactions = getAggregatedTransactions(
        Number(request.params.customerId)
    )
    if (!aggregatedTransactions) {
        return reply.internalServerError()
    }
    void reply.send(aggregatedTransactions)
}

const onGetTransactionsByCustomerId2 = async (
    _request: FastifyRequest<{
        Params: { customerId?: z.infer<typeof customerId> }
    }>,
    reply: FastifyReply
) => {
    const aggregatedTransactions = getAggregatedTransactions()
    if (!aggregatedTransactions) {
        return reply.internalServerError()
    }
    void reply.send(aggregatedTransactions)
}

export default getTransactionsByCustomerId
