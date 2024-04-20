import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import * as R from 'ramda'
import { ReadonlyDeep } from 'type-fest'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { transactions } from '../data.js'
import { mapRelatedCustomers } from '../handlers/related-customers.js'
import { relatedCustomerRecord } from '../model.js'
import { CustomerId, RelatedCustomer } from '../types.js'

const getCustomers: FastifyPluginAsync = async (server) =>
    void (await Promise.all([
        server.get<{
            Reply: RelatedCustomer[]
            Params: { customerId: CustomerId }
        }>('/relatedCustomers/:customerId', {
            schema: {
                response: {
                    200: zodToJsonSchema(relatedCustomerRecord),
                },
            },
            handler: onGetRelatedCustomers,
        }),
        server.get<{
            Reply: RelatedCustomer[]
            Params: { customerId: CustomerId }
        }>('/relatedCustomers', {
            handler: onGetRelatedCustomers,
        }),
    ]))

const onGetRelatedCustomers = async (
    request: ReadonlyDeep<
        FastifyRequest<{
            Params: { customerId?: CustomerId }
        }>
    >,
    reply: ReadonlyDeep<FastifyReply>
): Promise<RelatedCustomer[]> => {
    const customerId = request.params.customerId
    if (!customerId) return reply.badRequest('customerId is required.')

    const relatedCustomers = mapRelatedCustomers(await transactions)

    const filterByCustomerId = R.pipe(
        R.groupBy(R.propOr(-1, 'customerId')),
        R.prop(customerId)
    )(relatedCustomers)

    if (!filterByCustomerId) return []

    return reply.send(filterByCustomerId)
}

export default getCustomers
