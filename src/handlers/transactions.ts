import * as R from 'ramda'
import { ReadonlyDeep } from 'type-fest'

import { AggregatedTransaction, Timeline, Transaction } from '../types.js'

//
// Aggregate transactions by customerId and authorizationCode.
//
// First, group transactions by customerId. Grouping with authorizationCode instead would result in a merge of transactions with different customerIds, as authorizationCode is not unique to customer.
// Then, for each customerId, group transactions again, by authorizationCode. Result will represent the lifecycle of the transaction for each unique customer.
// Finally, create an aggregated transaction object by mapping transactions to the timeline, and re-assigning property values to match the challenge expected result.
//
// Let's create an example transaction where:
// - All transactions share the same authorizationCode, transactionType and customerId
// - transactionId 1 transactionStatus is PENDING.
// - transactionId 2 transactionStatus is SETTLED.
//
// transactionId                1         | 2
// transactionStatus            PENDING   | SETTLED
// transactionDate              Yesterday | Today
//
// When piped to aggregateTransactions, expected output is:
//
// transactionId                1
// transactionStatus            SETTLED
// createdAt                    Yesterday
// updatedAt                    Today
// timeline
// -----------------------------------------------------
//      status                  PENDING
//      createdAt               Yesterday
// -----------------------------------------------------
//      status                  SETTLED
//      createdAt               Today
//
// transactions.test.ts includes tests similar to example above.
//
export const aggregateTransactions = (
    transactions: ReadonlyDeep<Transaction[]>
): AggregatedTransaction[] => {
    const createNewTransactionObject = R.compose(
        R.map((transaction: ReadonlyDeep<Transaction[]>) => {
            const head = R.head(transaction)
            const last = R.last(transaction)
            if (!head || !last) return
            const {
                transactionDate: createdAt,
                transactionId,
                transactionType,
                description,
                customerId,
            } = head
            const {
                transactionDate: updatedAt,
                authorizationCode,
                transactionStatus: status,
            } = last
            return {
                createdAt,
                // updatedAt property value is modified only if there are subsequent transactions in the lifecycle.
                updatedAt: transaction.length === 1 ? undefined : updatedAt,
                customerId,
                transactionId,
                authorizationCode,
                status,
                description,
                transactionType,
                // I decided to follow the challenge instructions and return an empty metadata object.
                // I would suggest merging metadata of each transaction to represent a list of all deviceIds and relatedTransactionIds belonging to the transaction lifecycle.
                metadata: {},
                timeline: R.map(mapTimeline, transaction),
            }
        }),
        R.collectBy(R.prop('authorizationCode'))
    )

    return R.reject(
        R.isNil,
        R.flatten(
            R.compose(
                R.map(createNewTransactionObject),
                R.collectBy(R.prop('customerId'))
            )(transactions)
        )
    )
}

const mapTimeline = (transaction: ReadonlyDeep<Transaction>): Timeline => {
    const {
        transactionStatus: status,
        transactionDate: createdAt,
        amount,
    } = transaction
    return {
        status,
        createdAt,
        amount,
    }
}
