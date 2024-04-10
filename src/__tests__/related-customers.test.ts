import { expect, test } from '@jest/globals'
import supertest from 'supertest'

import app from '../app.js'

describe('Test /relatedCustomers endpoint', () => {
    test('GET /relatedCustomers/:id', async () => {
        const fastify = await app()
        await fastify.ready()

        const response = await supertest(fastify.server)
            .get('/relatedCustomers/1')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')

        expect(response.status).toEqual(200)
        await fastify.close()
    })
})
