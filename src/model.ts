import { parseISO } from 'date-fns'
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
        // updatedAt date must be older than createdAt date
        if (
            transaction.updatedAt &&
            parseISO(transaction.createdAt).getTime() >=
                parseISO(transaction.updatedAt).getTime()
        ) {
            context.addIssue({
                code: z.ZodIssueCode.invalid_date,
                message:
                    'createdAt and updatedAt does not respect timeline order.',
            })
        }
        // TODO Transaction timeline timestamps and status respect transaction lifecycle order
        // TODO Nested latest transaction data from the timeline matches the parent transaction data
        // TODO Validate amounts based on transactionType (e.g. 'RETURN' cannot be a negative value)
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
    relatedCustomerId: customerId,
    relationType,
})

const relatedCustomerRecord = z.array(
    relatedCustomer.omit({ customerId: true })
)

export {
    customerId,
    relatedCustomer,
    relatedCustomerRecord,
    transaction,
    transactionRecord,
    transactionType,
    aggregatedTransaction,
    aggregatedTransactionsRecord,
    dateTimeWithOffset,
    timeline,
    timelineRecord,
}
