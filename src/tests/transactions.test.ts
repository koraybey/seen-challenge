import { test } from '@jest/globals'
import { addHours } from 'date-fns'
import supertest from 'supertest'

import build from '../app.js'
import { mapTransactions } from '../handlers/transactions.js'
import { aggregatedTransactionsRecord, transactionRecord } from '../model.js'
import {
    createTimeline,
    createTransaction,
    parseISODatetime,
} from './data.mock.js'

describe('/transactions', () => {
    // eslint-plugin-jest does not detect assertions from supertest
    // eslint-disable-next-line jest/expect-expect
    test('GET with a customerId', async () => {
        const app = await build()
        await app.ready()

        await supertest(app.server)
            .get('/transactions/1')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')

        await app.close()
    })
    // eslint-disable-next-line jest/expect-expect
    test('GET without a customerId', async () => {
        const app = await build()
        await app.ready()

        await supertest(app.server)
            .get('/transactions/')
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')

        await app.close()
    })
})

test('Aggregate transactions by authorizationCode', () => {
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

    const expectedTransactions = [
        {
            ...parsedTransactions[0],
            status: parsedTransactions[2].transactionStatus,
            createdAt: parseISODatetime(addHours(now, 0)),
            updatedAt: parseISODatetime(addHours(now, 2)),
            timeline: [
                createTimeline({
                    createdAt: parseISODatetime(addHours(now, 0)),
                    status: 'PENDING',
                }),
                createTimeline({
                    createdAt: parseISODatetime(addHours(now, 1)),
                    status: 'SETTLED',
                }),
                createTimeline({
                    createdAt: parseISODatetime(addHours(now, 2)),
                    status: 'RETURNED',
                }),
            ],
        },
        {
            ...parsedTransactions[3],
            status: parsedTransactions[3].transactionStatus,
            createdAt: parseISODatetime(addHours(now, 3)),
            timeline: [
                createTimeline({
                    createdAt: parseISODatetime(addHours(now, 3)),
                    status: 'SETTLED',
                }),
            ],
        },
    ]

    const aggregatedTransactions = mapTransactions(parsedTransactions)
    const parsedExpectedTransactions =
        aggregatedTransactionsRecord.parse(expectedTransactions)
    const parsedAggregatedTransactions = aggregatedTransactionsRecord.parse(
        aggregatedTransactions
    )

    expect(parsedAggregatedTransactions).toEqual(parsedExpectedTransactions)
})

describe('Edge case Zod validations', () => {
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
        }),
    ]
    const parsedTransactions = transactionRecord.parse(transactions)
    test('ZodError when createdAt is older than updatedAt', async () => {
        const expectedTransactions = [
            {
                ...parsedTransactions[0],
                status: parsedTransactions[1].transactionStatus,
                createdAt: parseISODatetime(addHours(now, 1)),
                updatedAt: parseISODatetime(addHours(now, 1)),
                timeline: [
                    createTimeline({
                        createdAt: parseISODatetime(addHours(now, 0)),
                        status: 'PENDING',
                    }),
                    createTimeline({
                        createdAt: parseISODatetime(addHours(now, 1)),
                        status: 'SETTLED',
                    }),
                ],
            },
        ]
        await expect(
            aggregatedTransactionsRecord.parseAsync(expectedTransactions)
        ).rejects.toThrow(
            'createdAt and updatedAt does not respect timeline order.'
        )
    })
    test('ZodError when transactionId is not equal to transactionId of the latest transaction in the lifecycle', async () => {
        const expectedTransactions = [
            {
                ...parsedTransactions[0],
                status: parsedTransactions[0].transactionStatus,
                createdAt: parseISODatetime(addHours(now, 0)),
                updatedAt: parseISODatetime(addHours(now, 1)),
                timeline: [
                    createTimeline({
                        createdAt: parseISODatetime(addHours(now, 0)),
                        status: 'PENDING',
                    }),
                    createTimeline({
                        createdAt: parseISODatetime(addHours(now, 1)),
                        status: 'SETTLED',
                    }),
                ],
            },
        ]
        await expect(
            aggregatedTransactionsRecord.parseAsync(expectedTransactions)
        ).rejects.toThrow(
            'Transaction status is not equal to the status of the latest transaction from the transaction lifecycle.'
        )
    })
})
