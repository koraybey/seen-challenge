import axios from 'axios'

import { Transaction, transactionArraySchema } from '../schema.js'

export const getTransactions = async (): Promise<Transaction[]> => {
    const response = await axios.get(
        'https://cdn.seen.com/challenge/transactions-v2.json'
    )
    const parsedData = await transactionArraySchema.parseAsync(response.data)
    return parsedData
}
