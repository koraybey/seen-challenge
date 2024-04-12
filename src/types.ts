import { z } from 'zod'

import * as schema from './model.js'

type TransactionType = z.infer<typeof schema.transactionType>
type RelationType = z.infer<typeof schema.transactionType>
type RelatedCustomer = z.infer<typeof schema.relatedCustomer>
type AggregatedTransaction = z.infer<typeof schema.aggregatedTransaction>
type Timeline = z.infer<typeof schema.timeline>
type Transaction = z.infer<typeof schema.transaction>
type CustomerId = z.infer<typeof schema.customerId>

export {
    TransactionType,
    RelationType,
    RelatedCustomer,
    AggregatedTransaction,
    Timeline,
    Transaction,
    CustomerId,
}
