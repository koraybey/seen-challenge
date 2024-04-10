import * as R from 'ramda'

import { CustomerId, RelatedCustomer, Transaction } from '../schema.js'
import { getTransactions } from './get-transactions.js'

export const getRelatedCustomersData = async (customerId?: CustomerId) => {
    const transactions = await getTransactions()
    //
    // START relatedCustomers by deviceId
    //
    const devicesWithMultipleAccounts = R.compose(
        R.reject(R.compose(R.gte(1), R.length)),
        R.collectBy(R.pathOr('Unknown', ['metadata', 'deviceId'])),
        R.filter(R.pathSatisfies(R.isNotNil, ['metadata', 'deviceId']))
    )(transactions)

    const flagAccountsWithSameDevice = ({
        customerId,
    }: {
        customerId: CustomerId
    }) => {
        const customerIds = R.map(R.path(['customerId']))(
            R.flatten(devicesWithMultipleAccounts)
        )

        const omitEntryWithSameCustomerId = R.reject(
            R.propEq(customerId, 'customerId')
        )(R.flatten(devicesWithMultipleAccounts))

        const isRelated = R.includes(customerId, customerIds)
        if (!isRelated) return

        return {
            customerId,
            relatedCustomers: R.map(
                R.applySpec({
                    relatedCustomerId: R.prop('customerId'),
                    relationType: R.always('DEVICE'),
                })
            )(omitEntryWithSameCustomerId),
        }
    }

    const relatedCustomersByDeviceId = R.map(flagAccountsWithSameDevice)(
        R.flatten(devicesWithMultipleAccounts)
    )
    //
    // END relatedCustomers by deviceId
    //

    //
    // START relatedCustomers by relatedTransactionId
    //
    const findAndMapRelatedTransactions = ({
        customerId: relatedCustomerId,
        metadata,
        transactionType: relatedTransactionType,
    }: Transaction) => {
        const filteredData = transactions.filter(
            (d) =>
                d.customerId !== relatedCustomerId &&
                d.transactionId === metadata?.relatedTransactionId
        )
        return R.compose(
            R.map(
                R.compose(
                    R.pick(['relatedCustomers', 'customerId']),
                    R.assoc('relatedCustomers', [
                        {
                            relatedCustomerId,
                            relationType: relatedTransactionType,
                        },
                    ])
                )
            )
        )(filteredData)
    }

    const relatedCustomersByTransactionId = R.compose(
        R.flatten,
        R.map(findAndMapRelatedTransactions),
        R.filter(
            R.pathSatisfies(R.isNotNil, ['metadata', 'relatedTransactionId'])
        )
    )(transactions)
    //
    // END relatedCustomers by relatedTransactionIdq
    //

    //
    // START Update relatedCustomers
    //
    const updateCustomers = (
        newEntry: Partial<{
            customerId: CustomerId
            relatedCustomers: RelatedCustomer[]
        }>
    ) => {
        const oldEntry = relatedCustomersByDeviceId.find(
            (d) => d?.customerId === newEntry.customerId
        )
        return {
            customerId: newEntry.customerId,
            relatedCustomers: R.flatten([
                newEntry.relatedCustomers,
                oldEntry?.relatedCustomers || [],
            ]),
        }
    }
    // End Update relatedCustomers
    //

    return R.compose(
        R.map(updateCustomers),
        customerId ? R.filter(R.propEq(customerId, 'customerId')) : R.identity
    )(relatedCustomersByTransactionId)
}
