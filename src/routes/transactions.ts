import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { getTransactionsFromSource } from '../data.js'
import { aggregateTransactions } from '../handlers/transactions.js'
import { aggregatedTransactionsRecord } from '../model.js'
import { AggregatedTransaction, CustomerId } from '../types.js'

const getTransactions: FastifyPluginAsync = async (server) => {
    await Promise.all([
        server.get<{
            Reply: AggregatedTransaction[]
            Params: { customerId: CustomerId }
        }>('/transactions/:customerId', {
            schema: {
                response: {
                    200: zodToJsonSchema(aggregatedTransactionsRecord),
                },
            },
            handler: onGetTransactions,
        }),
        server.get<{
            Reply: AggregatedTransaction[]
            Params: { customerId: CustomerId }
        }>('/transactions', {
            handler: onGetTransactions,
        }),
    ])
}

const onGetTransactions = async (
    request: FastifyRequest<{
        Params: { customerId?: CustomerId }
    }>,
    reply: FastifyReply
) => {
    const customerId = request.params.customerId
    if (!customerId) {
        return reply.badRequest('customerId is required.')
    }
    const transactions = await getTransactionsFromSource()
    const aggregatedTransactions = aggregateTransactions(
        transactions,
        customerId
    )
    if (!aggregatedTransactions) return reply.internalServerError()

    void reply.send(aggregatedTransactions)
}

export default getTransactions
