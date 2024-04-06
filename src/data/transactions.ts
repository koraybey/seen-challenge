import axios from 'axios'

import { Transactions, transactionsSchema } from '../schema.js'

export const getTransactions = async (): Promise<Transactions> => {
    const response = await axios.get(
        'https://cdn.seen.com/challenge/transactions-v2.json'
    )
    const parsedData = transactionsSchema.parse(response.data)
    return parsedData
}
