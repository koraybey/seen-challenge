import * as R from 'ramda'

import { CustomerId, RelatedCustomer, Transaction } from '../types.js'

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
                R.collectBy(R.pathOr('Unknown', ['metadata', 'deviceId'])),
                R.reject(R.compose(R.gte(1), R.length)),
                R.flatten,
                R.map(flagAccountsWithSameDevice)
            )(transactions)
        )
    )
}

export const mapRelationsByRelatedTransactionId = (
    transactions: Transaction[]
): RelatedCustomer[] => {
    const findAndMapRelatedTransactions = ({
        customerId: relatedCustomerId,
        metadata,
    }: Transaction): RelatedCustomer | undefined => {
        const targetTransaction = transactions.find(
            (d) =>
                d.customerId !== relatedCustomerId &&
                d.transactionId === metadata?.relatedTransactionId
        )
        if (targetTransaction)
            return {
                customerId: targetTransaction.customerId,
                relatedCustomerId,
                relationType: targetTransaction.transactionType,
            }
    }
    return R.reject(
        R.isNil,
        R.pipe(
            R.filter(
                R.pathSatisfies(R.isNotNil, [
                    'metadata',
                    'relatedTransactionId',
                ])
            ),
            R.map(findAndMapRelatedTransactions)
        )(transactions)
    )
}

export const mapCustomerRelations = (
    transactions: Transaction[],
    customerId: CustomerId
): RelatedCustomer[] | undefined => {
    const relatedCustomersByDeviceId = mapRelationsByDeviceId(transactions)
    const relatedCustomersByRelatedTransactionId =
        mapRelationsByRelatedTransactionId(transactions)

    const relatedCustomerEntries = R.flatten([
        ...relatedCustomersByDeviceId,
        ...relatedCustomersByRelatedTransactionId,
    ])

    return R.pipe(
        R.groupBy(R.propOr('undefined', 'customerId')),
        R.prop(customerId)
    )(relatedCustomerEntries)
}
