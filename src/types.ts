import { z } from 'zod'

import * as schema from './model.js'

type TransactionType = z.infer<typeof schema.transactionType>
type RelationType = z.infer<typeof schema.transactionType>
type RelatedCustomer = z.infer<typeof schema.relatedCustomer>
type AggregatedTransaction = z.infer<typeof schema.aggregatedTransaction>
type Timeline = z.infer<typeof schema.timeline>
type Transaction = z.infer<typeof schema.transaction>
type TransactionStatus = z.infer<typeof schema.transactionStatus>
type CustomerId = z.infer<typeof schema.customerId>

export type {
    RelationType,
    RelatedCustomer,
    Transaction,
    TransactionStatus,
    TransactionType,
    AggregatedTransaction,
    CustomerId,
    Timeline,
}
