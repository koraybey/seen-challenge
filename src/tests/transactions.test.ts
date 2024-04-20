import { test } from '@jest/globals'
import { addHours, addMinutes } from 'date-fns'
import * as R from 'ramda'
import supertest from 'supertest'

import build from '../app.js'
import { aggregateTransactions } from '../handlers/transactions.js'
import {
    aggregatedTransactionsRecord,
    schemaError,
    transactionRecord,
} from '../model.js'
import { createTransaction, parseISODatetime } from './data.mock.js'

const now = Date.now()

const transactions = [
    createTransaction({
        transactionId: 1,
        authorizationCode: 'F00001',
        transactionDate: parseISODatetime(addHours(now, 0)),
        transactionStatus: 'PENDING',
    }),
    createTransaction({
        transactionId: 2,
        authorizationCode: 'F00001',
        transactionDate: parseISODatetime(addHours(now, 1)),
        transactionStatus: 'SETTLED',
        description: 'Amazon',
    }),
    createTransaction({
        transactionId: 3,
        authorizationCode: 'F00001',
        transactionDate: parseISODatetime(addHours(now, 2)),
        transactionStatus: 'RETURNED',
    }),
    createTransaction({
        transactionId: 4,
        customerId: 1,
        authorizationCode: 'F00002',
        transactionDate: parseISODatetime(addHours(now, 3)),
        transactionStatus: 'SETTLED',
    }),
]
const parsedTransactions = transactionRecord.parse(transactions)

describe('/transactions', () => {
    test('GET with a customerId', async () => {
        const app = await build()
        if (!app) return
        await app.ready()
        await supertest(app.server)
            .get('/transactions/1')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
        await app.close()
    })
    test('GET with a non-existent customerId', async () => {
        const app = await build()
        if (!app) return
        await app.ready()
        await supertest(app.server)
            .get('/transactions/10')
            .expect([])
            .expect('Content-Type', 'application/json; charset=utf-8')
        await app.close()
    })
    test('GET without a customerId', async () => {
        const app = await build()
        if (!app) return
        await app.ready()
        await supertest(app.server)
            .get('/transactions')
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
        await app.close()
    })

    test('Aggregate transactions by authorizationCode', () => {
        const expectedTransactions = [
            {
                ...R.nth(0, parsedTransactions),
                createdAt: R.nth(0, parsedTransactions)?.transactionDate,
                updatedAt: R.nth(2, parsedTransactions)?.transactionDate,
                status: R.nth(2, parsedTransactions)?.transactionStatus,
                timeline: [
                    {
                        createdAt: R.nth(0, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(0, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                    {
                        createdAt: R.nth(1, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(1, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                    {
                        createdAt: R.nth(2, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(2, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                ],
            },
            {
                ...R.nth(3, parsedTransactions),
                createdAt: R.nth(3, parsedTransactions)?.transactionDate,
                updatedAt: undefined,
                status: R.nth(3, parsedTransactions)?.transactionStatus,
                timeline: [
                    {
                        createdAt: R.nth(3, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(3, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                ],
            },
        ]

        const aggregatedTransactions = aggregateTransactions(parsedTransactions)

        expect(
            aggregatedTransactionsRecord.parse(aggregatedTransactions)
        ).toEqual(aggregatedTransactionsRecord.parse(expectedTransactions))
    })
})

describe('Throw ZodError when edge case validations fail', () => {
    test('status does not match transactionStatus of last transaction', async () => {
        const expectedTransactions = [
            {
                ...R.nth(0, parsedTransactions),
                createdAt: R.nth(0, parsedTransactions)?.transactionDate,
                updatedAt: R.nth(1, parsedTransactions)?.transactionDate,
                status: R.nth(0, parsedTransactions)?.transactionStatus, // R.nth(1, parsedTransactions)?.transactionStatus
                timeline: [
                    {
                        createdAt: R.nth(0, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(0, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                    {
                        createdAt: R.nth(1, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(1, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                ],
            },
        ]
        await expect(
            aggregatedTransactionsRecord.parseAsync(expectedTransactions)
        ).rejects.toThrow(schemaError[0])
    })

    test('createdAt cannot be older than updatedAt', async () => {
        const expectedTransactions = [
            {
                ...R.nth(0, parsedTransactions),
                createdAt: parseISODatetime(addHours(now, 3)), // R.nth(0, parsedTransactions)?.transactionDate
                updatedAt: R.nth(1, parsedTransactions)?.transactionDate,
                status: R.nth(1, parsedTransactions)?.transactionStatus,
                timeline: [
                    {
                        createdAt: R.nth(0, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(0, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                    {
                        createdAt: R.nth(1, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(1, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                ],
            },
        ]
        await expect(
            aggregatedTransactionsRecord.parseAsync(expectedTransactions)
        ).rejects.toThrow(schemaError[1])
    })

    test('createdAt does not match transactionDate of first transaction', async () => {
        const expectedTransactions = [
            {
                ...R.nth(0, parsedTransactions),
                createdAt: parseISODatetime(addMinutes(now, 15)), // R.nth(0, parsedTransactions)?.transactionDate
                updatedAt: R.nth(1, parsedTransactions)?.transactionDate,
                status: R.nth(1, parsedTransactions)?.transactionStatus,
                timeline: [
                    {
                        createdAt: R.nth(0, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(0, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                    {
                        createdAt: R.nth(1, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(1, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                ],
            },
        ]
        await expect(
            aggregatedTransactionsRecord.parseAsync(expectedTransactions)
        ).rejects.toThrow(schemaError[2])
    })

    test('updatedAt does not match transactionDate of last transaction', async () => {
        const expectedTransactions = [
            {
                ...R.nth(0, parsedTransactions),
                createdAt: R.nth(0, parsedTransactions)?.transactionDate,
                updatedAt: parseISODatetime(addHours(now, 6)), // R.nth(1, parsedTransactions)?.transactionDate
                status: R.nth(1, parsedTransactions)?.transactionStatus,
                timeline: [
                    {
                        createdAt: R.nth(0, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(0, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                    {
                        createdAt: R.nth(1, parsedTransactions)
                            ?.transactionDate,
                        status: R.nth(1, parsedTransactions)?.transactionStatus,
                        amount: 0,
                    },
                ],
            },
        ]
        await expect(
            aggregatedTransactionsRecord.parseAsync(expectedTransactions)
        ).rejects.toThrow(schemaError[3])
    })
})
