import { addHours, format } from 'date-fns'
import { ReadonlyDeep } from 'type-fest'
import { ReadonlyObjectDeep } from 'type-fest/source/readonly-deep.js'

import { dateTimeWithOffset } from '../model.js'
import { Transaction } from '../types.js'

const now = Date.now()
export const parseISODatetime = (date: ReadonlyObjectDeep<Date>) =>
    dateTimeWithOffset.parse(format(date, "yyyy-MM-dd'T'HH:mm:ssXX"))

export const createTransaction = ({
    transactionId,
    authorizationCode,
    transactionDate,
    customerId,
    transactionType,
    transactionStatus,
    description,
    amount,
    metadata,
}: ReadonlyDeep<Partial<Transaction>>): Partial<Transaction> => {
    return {
        transactionId: transactionId ?? 1,
        authorizationCode: authorizationCode ?? 'F00001',
        transactionDate: transactionDate ?? parseISODatetime(addHours(now, 0)),
        customerId: customerId ?? 0,
        transactionType: transactionType ?? 'POS',
        transactionStatus: transactionStatus ?? 'SETTLED',
        description: description ?? 'Amazon',
        amount: amount ?? 0,
        metadata: metadata ?? {},
    }
}
