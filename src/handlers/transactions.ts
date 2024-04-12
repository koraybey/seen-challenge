import * as R from 'ramda'

import { AggregatedTransaction, CustomerId, Transaction } from '../types.js'

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

export const mapTransactions = (
    transactions: Transaction[]
): AggregatedTransaction[] => {
    const createNewTransactionObject = (
        transaction: Transaction[]
    ): AggregatedTransaction | undefined => {
        const head = R.head(transaction)
        const last = R.last(transaction)
        if (!head || !last) return undefined
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
        const aggregatedTransaction = {
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
        return aggregatedTransaction
    }
    return R.reject(
        R.isNil,
        R.compose(
            R.map(createNewTransactionObject),
            R.collectBy(R.prop('authorizationCode'))
        )(transactions)
    )
}

export const aggregateTransactions = (
    transactions: Transaction[],
    customerId: CustomerId
): AggregatedTransaction[] | undefined => {
    const aggregatedTransactions = mapTransactions(transactions)
    return R.pipe(
        R.groupBy(R.propOr('undefined', 'customerId')),
        R.prop(customerId)
    )(aggregatedTransactions)
}
