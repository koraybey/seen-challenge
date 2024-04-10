import * as R from 'ramda'

import { AggregatedTransaction, CustomerId, Transaction } from '../schema.js'
import { getTransactions } from './get-transactions.js'

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

export const getTransactionsData = async (customerId?: CustomerId) => {
    const transactions = await getTransactions()

    const createNewTransactionObject = (
        data: Transaction[]
    ): AggregatedTransaction | undefined => {
        const head = R.head(data)
        const last = R.last(data)
        if (!head || !last) return undefined
        const {
            transactionDate: createdAt,
            transactionId,
            transactionType,
            description,
        } = head
        const {
            transactionDate: updatedAt,
            authorizationCode,
            transactionStatus: status,
        } = last
        return {
            createdAt,
            updatedAt,
            transactionId,
            authorizationCode,
            status,
            description,
            transactionType,
            metadata: {},
            timeline: R.map(mapTimeline, data),
        }
    }

    return R.compose(
        R.map(createNewTransactionObject),
        R.collectBy(R.prop('authorizationCode')),
        customerId ? R.filter(R.propEq(customerId, 'customerId')) : R.identity
    )(transactions)
}
