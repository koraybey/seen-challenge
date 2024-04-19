import * as R from 'ramda'

import { RelatedCustomer, Transaction } from '../types.js'

//
// Establish customer relations based on deviceId.
//
// Find all accounts with the same deviceId.
// Then, establish the relationship by mapping all the customerIds with the same deviceId to each other.
//
// Let's create an example transaction where:
// - customerId 1, customerId 2, and customerId 3 use the same device.
//
// customerId                       1      | 2      | 3
// ---------------------------------------------------------
//      metadata
// ---------------------------------------------------------
//           deviceId               ABC    | ABC    | ABC
//
// When piped to mapRelationsByDeviceId, expected output is:
//
// ---------------------------------------------------------
// relatedCustomers
// ---------------------------------------------------------
//      relatedCustomerId           2      | 3      | 1
//      relationType                DEVICE | DEVICE | DEVICE
// ---------------------------------------------------------
//      relatedCustomerId           3      | 1      | 2
//      relationType                DEVICE | DEVICE | DEVICE
//
// related-customers.test.ts includes tests containing examples.
//
export const mapRelationsByDeviceId = (
    transactions: Transaction[]
): RelatedCustomer[] => {
    const flagAccountsWithSameDevice = (
        transaction: Transaction
    ): RelatedCustomer[] | undefined => {
        const customerIds = R.map(R.path(['customerId']))(transactions)
        const isRelated = R.includes(transaction.customerId, customerIds)
        const accountsWithSameDevice = R.map(
            R.applySpec<RelatedCustomer>({
                relatedCustomerId: R.prop('customerId'),
                relationType: R.always('DEVICE'),
                customerId: R.always(transaction.customerId),
            })
        )(
            R.filter(
                R.pathEq(transaction.metadata?.deviceId, [
                    'metadata',
                    'deviceId',
                ]),
                R.reject(R.propEq(transaction.customerId, 'customerId'))(
                    transactions
                )
            )
        )

        if (isRelated) return accountsWithSameDevice
    }

    return R.reject(
        R.isNil,
        R.flatten(
            R.pipe(
                R.filter(R.pathSatisfies(R.isNotNil, ['metadata', 'deviceId'])),
                R.collectBy(R.pathOr(-1, ['metadata', 'deviceId'])),
                R.flatten,
                R.map(flagAccountsWithSameDevice)
            )(transactions)
        )
    )
}

//
// Establish customer relations based on relatedTransactionId and transactionId.
//
// Most transactions include a relatedTransactionId.
// Find related transaction by relatedTransactionId and compare it to the origin transaction that contains the relatedTransactionId.
// If customerIds are not equal, then transactions belong to different accounts.
// In that case, it is safe to assume these users are related by transaction.
//
// Let's create an example transaction where:
// - customerId 1 sends funds to customerId 2, hence customerId 1 is related to customerId 2 for sending funds (P2P_SEND)
// - customerId 2 receives funds from customerId 1, hence customerId 2 is related to customerId 1 for receiving funds (P2P_RECEIVE)
//
// customerId                       1        | 2
// transactionType                  P2P_SEND | P2P_RECEIVE
// transactionId                    1        | 2
// -------------------------------------------------------
// metadata
// -------------------------------------------------------
//      relatedTransactionId        2        | 1
//
// When piped to mapRelationsByRelatedTransactionId, expected output is:
//
// -------------------------------------------------------
// relatedCustomers
// -------------------------------------------------------
//      relationType                P2P_SEND | P2P_RECEIVE
//      relatedCustomerId           2        | 1
//
// related-customers.test.ts includes tests containing examples.
//
export const mapRelationsByRelatedTransactionId = (
    transactions: Transaction[]
): RelatedCustomer[] => {
    const findAndMapRelatedTransactions = ({
        customerId: relatedCustomerId,
        metadata,
        transactionId: relatedTransactionId,
    }: Transaction): RelatedCustomer | undefined => {
        const targetTransaction = transactions.find(
            (d) =>
                // Find the target transaction by comparing origin relatedTransactionId to destination transactionId.
                d.transactionId === metadata?.relatedTransactionId &&
                // Transaction must belong to different users, check customerIds.
                d.customerId !== relatedCustomerId &&
                // Origin transaction relatedTransactionId must be equal to relatedTransactionId of target transaction.
                d.metadata.relatedTransactionId === relatedTransactionId
        )
        if (targetTransaction)
            return {
                customerId: targetTransaction.customerId,
                relatedCustomerId,
                relationType: targetTransaction.transactionType,
            }
    }
    return R.reject(R.isNil, R.map(findAndMapRelatedTransactions)(transactions))
}

export const mapRelatedCustomers = (
    transactions: Transaction[]
): RelatedCustomer[] => {
    const relatedCustomersByDeviceId = mapRelationsByDeviceId(transactions)
    const relatedCustomersByRelatedTransactionId =
        mapRelationsByRelatedTransactionId(transactions)

    const relatedCustomers = R.flatten([
        ...relatedCustomersByDeviceId,
        ...relatedCustomersByRelatedTransactionId,
    ])

    return relatedCustomers
}
