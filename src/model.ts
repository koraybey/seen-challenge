import { parseISO } from 'date-fns'
import * as R from 'ramda'
import { z } from 'zod'

// Using Zod because:
// 1) Eliminates the need for type declarations with schema type inference.
// 2) Error method includes an argument for custom error message.
// 3) Comes with a variety of string-specific validations. For example, I noticed transaction data contains ISO 8601 datetime with the time offset. I can enforce it with "z.string().datetime()" method and add sub-second decimal precision if necessary.

/**
 *
 * @remark Transaction types
 *
 * ACH_INCOMING: Bank-to-bank transfer RECEIVED by the customer. DOES NOT settle immediately. DOES NOT originate from the application.
 *
 * ACH_OUTGOING: Bank-to-bank transfer SENT by the customer. DOES NOT settle immediately. DOES originate from the application.
 *
 * WIRE_INCOMING: Bank-to-bank transfer RECEIVED by the customer. DOES settle immediately (in most cases). DOES NOT originate from the application.
 *
 * WIRE_OUTGOING: Bank-to-bank transfer SENT by the customer. DOES settle immediately (in most cases). DOES NOT originate from the application.
 *
 * P2P_SEND: In-app transfer SENT by the customer. Settlement timelapse UNKNOWN. DOES originate from the application.
 *
 * P2P_RECEIVE: In-app transfer RECEIVED by the customer. Settlement timelapse UNKNOWN. DOES NOT originate from the application (Doesn't sender use the application to execute P2P_SEND?).
 *
 * POS: Physical or digital card transaction. Settlement timelapse UNKNOWN. DOES NOT originate from the application.
 *
 * FEE: Certain transactions incur an additional fee. MAY or MAY NOT originate from the application.
 *
 */
const transactionTypeList = [
    'ACH_INCOMING',
    'ACH_OUTGOING',
    'WIRE_INCOMING',
    'WIRE_OUTGOING',
    'P2P_SEND',
    'P2P_RECEIVE',
    'POS',
    'FEE',
] as const

const transactionType = z.enum(transactionTypeList)

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
const transactionStatus = z.enum(['PENDING', 'SETTLED', 'RETURNED'])

// Assuming authorizationCode always starts with the letter F.
const authorizationCode = z
    .string()
    .startsWith('F', { message: 'Unknown authorizationCode.' })

// Sequential IDs pose security risk. In production, I would use an UUID or a hash value
const transactionId = z.number()
const customerId = z.number()

// Assuming description contains name of the entity making the transaction.
const description = z.string().max(255, 'Transaction description is too long.')

// Assuming any inbound and outbound transaction amount is capped to 100_000 units.
const amount = z
    .number()
    .min(-100_000, 'Transaction amount exceeds the allowed minimum.')
    .max(100_000, 'Transaction amount exceeds the allowed maximum.')

const metadata = z.object({
    relatedTransactionId: z.number().optional(),
    deviceId: z.string().optional(),
})

const dateTimeWithOffset = z.string().datetime({
    offset: true,
    message: 'Transaction date must be ISO 8601 with the offset.',
})

const transaction = z.object({
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
const transactionRecord = z.array(transaction)

const timeline = z.object({
    createdAt: dateTimeWithOffset,
    status: transactionStatus,
    amount,
})
const timelineRecord = z.array(timeline)

const schemaError = [
    'status does not match transactionStatus of last transaction.',
    'createdAt cannot be older than updatedAt.',
    'createdAt does not match transactionDate of first transaction.',
    'updatedAt does not match transactionDate of last transaction.',
]

const aggregatedTransaction = z
    .object({
        createdAt: dateTimeWithOffset,
        updatedAt: dateTimeWithOffset.optional(),
        customerId,
        transactionId, // First recorded transaction id
        authorizationCode,
        status: transactionStatus,
        description,
        transactionType,
        metadata,
        timeline: timelineRecord,
    })
    .superRefine((transaction, context) => {
        if (!transaction) return
        if (transaction.status !== R.last(transaction.timeline)?.status)
            context.addIssue({
                code: z.ZodIssueCode.invalid_date,
                message: schemaError[0],
            })
        if (
            transaction.updatedAt &&
            parseISO(transaction.createdAt).getTime() >=
                parseISO(transaction.updatedAt).getTime()
        )
            context.addIssue({
                code: z.ZodIssueCode.invalid_date,
                message: schemaError[1],
            })
        if (transaction.createdAt !== R.head(transaction.timeline)?.createdAt)
            context.addIssue({
                code: z.ZodIssueCode.invalid_date,
                message: schemaError[2],
            })
        if (!(transaction.timeline.length >= 2)) return
        if (transaction.updatedAt !== R.last(transaction.timeline)?.createdAt)
            context.addIssue({
                code: z.ZodIssueCode.invalid_date,
                message: schemaError[3],
            })
    })

const aggregatedTransactionsRecord = z.array(aggregatedTransaction)

/**
 *
 * @remark Fraud signals
 *
 * Fraud rings: Multiple customers transacting with an unique device.
 *
 * Fraud rings or identity theft: Money distributed in multiple accounts, then concentrated into one account and withdrawn.
 *
 * Account takeover: Irregular account behaviour.
 *
 * Money laundering: Customer sends money in and out immediately, transacts with high-risk entities or exclusively uses payment apps without POS transactions using credit card.
 *
 */
const relationType = z.enum([...transactionTypeList, 'DEVICE'])

const relatedCustomer = z.object({
    customerId,
    transactionId,
    relatedCustomerId: customerId,
    relationType,
    relatedTransactionId: transactionId,
})

const relatedCustomerRecord = z.array(
    relatedCustomer.omit({
        customerId: true,
        relatedTransactionId: true,
        transactionId: true,
    })
)

export {
    customerId,
    relatedCustomer,
    relatedCustomerRecord,
    transaction,
    transactionRecord,
    transactionType,
    transactionStatus,
    aggregatedTransaction,
    aggregatedTransactionsRecord,
    dateTimeWithOffset,
    timeline,
    timelineRecord,
    schemaError,
}
