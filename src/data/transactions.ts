import axios from 'axios'
import * as R from 'ramda'

import {
    AggregatedTransaction,
    CustomerId,
    Transaction,
    transactionArraySchema,
} from '../schema.js'

export const getTransactions = async (): Promise<Transaction[]> => {
    const response = await axios.get(
        'https://cdn.seen.com/challenge/transactions-v2.json'
    )
    const parsedData = await transactionArraySchema.parseAsync(response.data)
    return parsedData
}

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

const mapTimeline = (data: Transaction) => {
    const {
        transactionStatus: status,
        transactionDate: createdAt,
        // amount,
        ...rest // TODO Remove
    } = data
    return {
        status,
        createdAt,
        // amount,
        ...rest, // TODO Remove
    }
}

export const getAggregatedTransactions = (customerId?: CustomerId) =>
    R.compose(
        R.map(createNewTransactionObject),
        R.collectBy(R.prop('authorizationCode')),
        customerId ? R.filter(R.propEq(customerId, 'customerId')) : R.identity
    )(transactions)
