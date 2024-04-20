import axios from 'axios'
import { Effect, Schedule } from 'effect'

import { transactionRecord } from './model.js'
import { Transaction } from './types.js'

const url = 'https://cdn.seen.com/challenge/transactions-v2.json'

const getTransactions = Effect.promise(() =>
    Promise.resolve(axios.get<Transaction[]>(url))
).pipe(
    Effect.withRequestCaching(true),
    Effect.timeout(5000),
    Effect.retry(
        Schedule.exponential(1000).pipe(Schedule.compose(Schedule.recurs(3)))
    )
)

export const transactions = Effect.runPromise(getTransactions).then((d) =>
    transactionRecord.parse(d.data)
)
