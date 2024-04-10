import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { getRelatedCustomersData } from '../data/related-customers.js'
import { customerId, Transaction } from '../schema.js'

const getRelatedCustomers: FastifyPluginAsync = async (server) => {
    await Promise.all([
        server.get<{
            Reply: Transaction[]
            Params: { customerId: z.infer<typeof customerId> }
        }>('/relatedCustomers/:customerId', {
            handler: onGetRelatedCustomers,
        }),
        server.get<{
            Reply: Transaction[]
            Params: { customerId: z.infer<typeof customerId> }
        }>('/relatedCustomers', {
            handler: onGetRelatedCustomers,
        }),
    ])
}

const onGetRelatedCustomers = async (
    request: FastifyRequest<{
        Params: { customerId?: z.infer<typeof customerId> }
    }>,
    reply: FastifyReply
) => {
    const relatedCustomers = await getRelatedCustomersData(
        request.params.customerId
    )
    if (!relatedCustomers) {
        return reply.internalServerError()
    }
    void reply.send(relatedCustomers)
}

export default getRelatedCustomers
