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
    const aggregatedTransactions = mapTransactions(parsedTransactions)

    const expectedTransactions = [
        {
            ...transactions[0],
            status: transactions[2].transactionStatus,
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
            ...transactions[3],
            status: transactions[3].transactionStatus,
            createdAt: parseISODatetime(addHours(now, 3)),
            timeline: [
                createTimeline({
                    createdAt: parseISODatetime(addHours(now, 3)),
                    status: 'SETTLED',
                }),
            ],
        },
    ]
    const parsedExpectedTransactions =
        aggregatedTransactionsRecord.parse(expectedTransactions)

    expect(aggregatedTransactions).toEqual(parsedExpectedTransactions)
})

test('Invalid timestamp order', () => {
    const now = Date.now()
    const transactions = [
        createTransaction({
            transactionId: 1,
            authorizationCode: 'F00001',
            transactionDate: parseISODatetime(addHours(now, 1)),
        }),
        createTransaction({
            transactionId: 2,
            authorizationCode: 'F00001',
            transactionDate: parseISODatetime(addHours(now, 0)),
        }),
    ]
    const parsedTransactions = transactionRecord.parse(transactions)
    const aggregatedTransactions = mapTransactions(parsedTransactions)

    const expectedTransactions = [
        {
            ...transactions[0],
            status: transactions[0].transactionStatus,
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
    const parsedExpectedTransactions =
        aggregatedTransactionsRecord.parse(expectedTransactions)

    expect(aggregatedTransactions).not.toEqual(parsedExpectedTransactions)
})
