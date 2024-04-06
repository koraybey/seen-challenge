// Using Zod because:
// 1) Eliminates the need for type declarations with schema type inference.
// 2) Error method includes an argument for custom error message.
// 3) Comes with a variety of string-specific validations. For example, I noticed transaction data contains ISO 8601 datetime with the time offset. I can enforce it with "z.string().datetime()" method and add sub-second decimal precision if necessary.
import { z } from 'zod'

/**
 *
 * @remark Transaction types
 *
 * ACH_INCOMING: Bank-to-bank transfer RECEIVED by the customer. DOES NOT settle immediately. DOES NOT originate from the application.
 * ACH_OUTGOING: Bank-to-bank transfer SENT by the customer. DOES NOT settle immediately. DOES originate from the application.
 * WIRE_INCOMING: Bank-to-bank transfer RECEIVED by the customer. DOES settle immediately (in most cases). DOES NOT originate from the application.
 * WIRE_OUTGOING: Bank-to-bank transfer SENT by the customer. DOES settle immediately (in most cases). DOES NOT originate from the application.
 * P2P_SEND: In-app transfer SENT by the customer. Settlement timelapse UNKNOWN. DOES originate from the application.
 * P2P_RECEIVE: In-app transfer RECEIVED by the customer. Settlement timelapse UNKNOWN. DOES NOT originate from the application (Doesn't sender use the application to execute P2P_SEND?).
 * POS: Physical or digital card transaction. Settlement timelapse UNKNOWN. DOES NOT originate from the application.
 * FEE: Certain transactions incur an additional fee. MAY or MAY NOT originate from the application.
 *
 */
const transactionType = z.enum([
    'ACH_INCOMING',
    'ACH_OUTGOING',
    'WIRE_INCOMING',
    'WIRE_OUTGOING',
    'P2P_SEND',
    'P2P_RECEIVE',
    'POS',
    'FEE',
])

/**
 *
 * @remark Transaction lifecycle
 *
 * In progress or dangling: -> Processing
 * Settles Immediately: -> Settled
 * Two step: -> Processing -> Settled
 * Returned (or refunded): -> Processing -> Settled -> Returned
 *
 */
const transactionStatus = z.enum(['SETTLED', 'PENDING', 'RETURNED'])

const authorizationCode = z
    .string()
    .startsWith('F', { message: 'Unknown authorizationCode.' }) // Assuming authorizationCode always starts with the letter F

const transactionId = z.number()

const description = z.string()

const amount = z.number()

const metadata = z.object({
    relatedTransactionId: z.number().optional(),
    deviceId: z.string().optional(),
})

const dateTimeWithOffset = z.string().datetime({
    offset: true,
    message:
        'transactionDate is invalid. Must be UTC with the timezone offset.',
})

const timeline = z.object({
    createdAt: dateTimeWithOffset,
    status: transactionStatus,
    amount,
})

export const customerId = z.number()

export const transactionsSchema = z.array(
    z.object({
        transactionId,
        authorizationCode,
        transactionDate: dateTimeWithOffset,
        customerId,
        transactionType,
        transactionStatus,
        description,
        amount,
        metadata,
    })
)

export const aggregatedTransactionsSchema = z.array(
    z.object({
        createdAt: dateTimeWithOffset,
        updatedAt: dateTimeWithOffset.nullable(),
        transactionId, // First recorded transaction id
        authorizationCode,
        status: transactionStatus,
        description,
        transactionType,
        metadata,
        timeline,
    })
)

/**
 *
 * @remark Fraud signals
 *
 * Fraud rings: Multiple customers transacting with an unique device.
 * Fraud rings or identity theft: Money distributed in multiple accounts, then concentrated into one account and withdrawn.
 * Account takeover: Irregular account behaviour.
 * Money laundering: Customer sends money in and out immediately, transacts with high-risk entities or exclusively uses payment apps without POS transactions using credit card.
 *
 */
export const relatedCustomers = z.array(
    z.object({
        relatedCustomers: customerId.optional(),
        relationType: z.string().optional(),
    })
)

export type Transactions = z.infer<typeof transactionsSchema>
export type AggregatedTransactions = z.infer<
    typeof aggregatedTransactionsSchema
>
export type RelatedCustomers = z.infer<typeof relatedCustomers>
