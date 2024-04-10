// import * as R from 'ramda'
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

export type TransactionType = z.infer<typeof transactionType>

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

const description = z.string().max(255, 'Transaction description is too long.') // Assuming description contains name of the entity making the transaction.

// Assuming any inbound and outbound transaction amount is capped to 100_000 units.
const amount = z
    .number()
    .min(-100_000, 'Transaction amount exceeds the allowed minimum.')
    .max(100_000, 'Transaction amount exceeds the allowed maximum.')

const metadata = z.object({
    relatedTransactionId: z.number().optional(),
    deviceId: z.string().optional(),
})

export const dateTimeWithOffset = z.string().datetime({
    offset: true,
    message: 'Transaction date must be ISO 8601 with the offset.',
})
// Sequential IDs pose security risk. In production, I would use an UUID or a hash value
export const customerId = z.number()
export type CustomerId = z.infer<typeof customerId>

export const transactionObjectSchema = z.object({
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
export const transactionArraySchema = z.array(transactionObjectSchema)
export type Transaction = z.infer<typeof transactionObjectSchema>

const timelineObjectSchema = z.object({
    createdAt: dateTimeWithOffset,
    status: transactionStatus,
    amount,
})
const timelineArraySchema = z.array(timelineObjectSchema)
export type Timeline = z.infer<typeof timelineObjectSchema>

export const aggregatedTransactionSchema = z.object({
    createdAt: dateTimeWithOffset,
    updatedAt: dateTimeWithOffset.optional(),
    transactionId, // First recorded transaction id
    authorizationCode,
    status: transactionStatus,
    description,
    transactionType,
    metadata,
    timeline: timelineArraySchema,
})
export const aggregatedTransactionsArraySchema = z.array(
    aggregatedTransactionSchema
)

export type AggregatedTransaction = z.infer<typeof aggregatedTransactionSchema>

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
export const relatedCustomerSchema = z.object({
    relatedCustomerId: customerId.optional(),
    relationType: transactionType,
})

export const relatedCustomerArraySchema = z.array(relatedCustomerSchema)
export type RelatedCustomer = z.infer<typeof relatedCustomerSchema>

// This function performs validation based on transactionStatus
// 1) Checks for duplicates
// 2) Checks for unknown lifecycle patterns
// 3) Validates the order of transactions by checking the timestamp
// const validationsRelatedToTransactionStatus = (
//     transaction: AggregatedTransaction,
//     context: z.RefinementCtx
// ) => {
//     const { timeline } = transaction

//     R.cond([
//         [
//             R.compose(R.includes(['PROCESSING']), R.prop('status')),
//             () => zodIssueInvalidTransactionLifecycle(context),
//         ],
//         [
//             R.compose(R.includes(['SETTLED']), R.prop('status')),
//             () => zodIssueInvalidTransactionLifecycle(context),
//         ],
//         [
//             R.compose(
//                 R.includes(['PROCESSING', 'SETTLED', 'RETURNED']),
//                 R.prop('status')
//             ),
//             () => zodIssueInvalidTransactionLifecycle(context),
//         ],
//     ])(timeline)
// }

// const zodIssueInvalidTransactionLifecycle = (context: z.RefinementCtx) =>
//     context.addIssue({
//         code: z.ZodIssueCode.invalid_date,
//         message: 'Invalid order detected in transaction lifecycle.',
//     })
