import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import * as R from 'ramda'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { getTransactionsFromSource } from '../data.js'
import { mapCustomerRelations } from '../handlers/related-customers.js'
import { relatedCustomerRecord } from '../model.js'
import { CustomerId, RelatedCustomer } from '../types.js'

const getCustomers: FastifyPluginAsync = async (server) => {
    await Promise.all([
        server.get<{
            Reply: RelatedCustomer[]
            Params: { customerId: CustomerId }
        }>('/relatedCustomers/:customerId', {
            handler: onGetRelatedCustomers,
            schema: {
                response: {
                    200: zodToJsonSchema(relatedCustomerRecord),
                },
            },
        }),
        server.get<{
            Reply: RelatedCustomer[]
            Params: { customerId: CustomerId }
        }>('/relatedCustomers', {
            handler: onGetRelatedCustomers,
        }),
    ])
}

const onGetRelatedCustomers = async (
    request: FastifyRequest<{
        Params: { customerId?: CustomerId }
    }>,
    reply: FastifyReply
) => {
    const customerId = request.params.customerId
    if (!customerId) return reply.badRequest('customerId is required.')

    const transactions = await getTransactionsFromSource()
    const relatedCustomers = mapCustomerRelations(transactions, customerId)
    if (!relatedCustomers) return reply.internalServerError()

    void reply.send(
        R.map<RelatedCustomer, Partial<RelatedCustomer>>(
            R.omit(['customerId']),
            relatedCustomers
        )
    )
}

export default getCustomers
