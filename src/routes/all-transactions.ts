import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { getTransactions } from '../data/transactions.js'
import { customerId, Transactions, transactionsSchema } from '../schema.js'

// eslint-disable-next-line @typescript-eslint/require-await
const getAllTransactions: FastifyPluginAsync = async (f) => {
    f.get<{
        Reply: Transactions
        Params: { customerId: z.infer<typeof customerId> }
    }>('/transactions', {
        schema: {
            response: {
                200: zodToJsonSchema(transactionsSchema),
            },
        },
        handler: onGetAllTransactions,
    })
}

const onGetAllTransactions = async (
    _request: FastifyRequest,
    reply: FastifyReply
) => {
    const transactions = await getTransactions()
    if (!transactions) {
        return reply.internalServerError()
    }
    void reply.send(transactions)
}

export default getAllTransactions
