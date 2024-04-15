import { test } from '@jest/globals'
import supertest from 'supertest'

import build from '../app.js'
import {
    mapRelationsByDeviceId,
    mapRelationsByRelatedTransactionId,
} from '../handlers/related-customers.js'
import { transactionRecord } from '../model.js'
import { createTransaction } from './data.mock.js'

describe('/relatedCustomers', () => {
    // eslint-plugin-jest does not detect assertions from supertest
    // eslint-disable-next-line jest/expect-expect
    test('GET with a customerId', async () => {
        const app = await build()
        await app.ready()

        await supertest(app.server)
            .get('/relatedCustomers/3')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')

        await app.close()
    })
    // eslint-disable-next-line jest/expect-expect
    test('GET without a customerId', async () => {
        const app = await build()
        await app.ready()

        await supertest(app.server)
            .get('/relatedCustomers')
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')

        await app.close()
    })
})

describe('Fraud detection and relatedCustomers mapping functions', () => {
    test('Find deviceId present in more than one unique user accounts and create relations', () => {
        const transactions = [
            createTransaction({
                customerId: 1,
                metadata: {
                    deviceId: 'A',
                },
            }),
            createTransaction({
                customerId: 2,
                metadata: {
                    deviceId: 'A',
                },
            }),
            createTransaction({
                customerId: 3,
                metadata: {
                    deviceId: 'A',
                },
            }),
            createTransaction({
                customerId: 4,
                metadata: {
                    deviceId: 'B',
                },
            }),
            createTransaction({
                customerId: 5,
                metadata: {
                    deviceId: 'B',
                },
            }),
        ]
        const parsedTransactions = transactionRecord.parse(transactions)
        const relatedCustomersByDeviceId =
            mapRelationsByDeviceId(parsedTransactions)
        const relationType = 'DEVICE'
        const expectedRelatedCustomers = [
            {
                customerId: 1,
                relatedCustomerId: 2,
                relationType,
            },
            {
                customerId: 1,
                relatedCustomerId: 3,
                relationType,
            },
            {
                customerId: 2,
                relatedCustomerId: 1,
                relationType,
            },
            {
                customerId: 2,
                relatedCustomerId: 3,
                relationType,
            },

            {
                customerId: 3,
                relatedCustomerId: 1,
                relationType,
            },
            {
                customerId: 3,
                relatedCustomerId: 2,
                relationType,
            },

            {
                customerId: 4,
                relatedCustomerId: 5,
                relationType,
            },
            {
                customerId: 5,
                relatedCustomerId: 4,
                relationType,
            },
        ]
        expect(relatedCustomersByDeviceId).toEqual(expectedRelatedCustomers)
    })
    test('Map relations between customers based on relatedTransactionId', () => {
        const transactions = [
            createTransaction({
                customerId: 1,
                transactionId: 1,
                transactionType: 'P2P_SEND',
                metadata: {
                    relatedTransactionId: 2,
                },
            }),
            createTransaction({
                customerId: 2,
                transactionId: 2,
                transactionType: 'P2P_RECEIVE',
                metadata: {
                    relatedTransactionId: 1,
                },
            }),
            createTransaction({
                customerId: 3,
                transactionId: 3,
                transactionType: 'WIRE_OUTGOING',
                metadata: {
                    relatedTransactionId: 5,
                },
            }),
            createTransaction({
                customerId: 4,
                transactionId: 4,
                transactionType: 'ACH_INCOMING',
                metadata: {},
            }),
            createTransaction({
                customerId: 5,
                transactionId: 5,
                transactionType: 'WIRE_INCOMING',
                metadata: {},
            }),
        ]
        const parsedTransactions = transactionRecord.parse(transactions)
        const relatedCustomersByRelatedtransactionId =
            mapRelationsByRelatedTransactionId(parsedTransactions)
        const expectedRelatedCustomers = [
            {
                customerId: 2,
                relatedCustomerId: 1,
                relatedTransactionId: 1,
                relationType: 'P2P_RECEIVE',
                transactionId: 2,
            },
            {
                customerId: 1,
                relatedCustomerId: 2,
                relatedTransactionId: 2,
                relationType: 'P2P_SEND',
                transactionId: 1,
            },
            {
                customerId: 5,
                relatedCustomerId: 3,
                relatedTransactionId: 3,
                relationType: 'WIRE_INCOMING',
                transactionId: 5,
            },
        ]
        expect(relatedCustomersByRelatedtransactionId).toEqual(
            expectedRelatedCustomers
        )
    })
})
