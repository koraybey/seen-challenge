import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import * as R from 'ramda'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { transactionsData } from '../data.js'
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

    const aggregatedTransactions = aggregateTransactions(await transactionsData)

    const transactionsByCustomerId = R.pipe(
        R.groupBy(R.propOr(-1, 'customerId')),
        R.prop(customerId)
    )(aggregatedTransactions)

    if (!transactionsByCustomerId) return []

    void reply.send(transactionsByCustomerId)
}

export default getTransactions
