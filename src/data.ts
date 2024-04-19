import axios from 'axios'

import { transactionRecord } from './model.js'
import { Transaction } from './types.js'

const getTransactionsFromSource = async (): Promise<Transaction[]> => {
    const response = await axios.get(
        'https://cdn.seen.com/challenge/transactions-v2.json'
    )
    const parsedData = await transactionRecord.parseAsync(response.data)
    return parsedData
}

export const transactionsData = getTransactionsFromSource()
