import * as R from 'ramda'

import { AggregatedTransaction, Transaction } from '../types.js'

const mapTimeline = (data: Transaction) => {
    const {
        transactionStatus: status,
        transactionDate: createdAt,
        amount,
    } = data
    return {
        status,
        createdAt,
        amount,
    }
}

export const aggregateTransactions = (
    transactions: Transaction[]
): AggregatedTransaction[] => {
    const createNewTransactionObject = R.compose(
        R.map((transaction: Transaction[]) => {
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
                updatedAt: transaction.length === 1 ? undefined : updatedAt,
                customerId,
                transactionId,
                authorizationCode,
                status,
                description,
                transactionType,
                metadata: {},
                timeline: R.map(mapTimeline, transaction),
            }
        }),
        R.collectBy(R.pathOr(-1, ['authorizationCode']))
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
