import { addHours, format } from 'date-fns'

import { dateTimeWithOffset } from '../model.js'
import { Timeline, Transaction } from '../types.js'

const now = Date.now()
export const parseISODatetime = (date: Date) =>
    dateTimeWithOffset.parse(format(date, "yyyy-MM-dd'T'HH:mm:ssXX"))

export const createTimeline = ({
    createdAt,
    status,
    amount,
}: Partial<Timeline>): Timeline => {
    return {
        createdAt: createdAt ?? parseISODatetime(addHours(now, 0)),
        status: status ?? 'SETTLED',
        amount: amount ?? 0,
    }
}

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
}: Partial<Transaction>): Transaction => {
    return {
        transactionId: transactionId ?? 1,
        authorizationCode: authorizationCode ?? 'F00001',
        transactionDate: transactionDate ?? parseISODatetime(addHours(now, 3)),
        customerId: customerId ?? 0,
        transactionType: transactionType ?? 'POS',
        transactionStatus: transactionStatus ?? 'SETTLED',
        description: description ?? 'Amazon',
        amount: amount ?? 0,
        metadata: metadata ?? {},
    }
}
