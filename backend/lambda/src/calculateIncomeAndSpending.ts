import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { GetEntities, GetItems, GetUser } from './queries/Entities'
import { decryptItemsInBatches } from './queries/Encryption'
import { mapDdbResponseToItem } from './mappers/Item'
import { HighLevelTransactionCategory, Item, Transaction } from './API'
import { mapDynamoDBToTransaction } from './mappers/Transactions'
import { uploadSpendingSummaries } from './queries/Summaries'
import { any } from 'zod'

const client = new DynamoDBClient({ region: 'ca-central-1' })

export type DailySpendingSummary = {
    date: string
    spending: { [category in HighLevelTransactionCategory]?: number }
}

export type AggregatedSpending = {
    daily_spending: DailySpendingSummary[]
    weekly_spending: { [category in HighLevelTransactionCategory]?: number }
    monthly_spending: { [category in HighLevelTransactionCategory]?: number }
}

type MonthlySpendingAggregates = {
    [monthYear: string]: AggregatedSpending
}

function aggregateSpendingByCategory(transactions: Transaction[]): AggregatedSpending {
    const MS_IN_A_DAY = 1000 * 60 * 60 * 24

    // Initialize accumulators
    const dailySpendingMap: { [date: string]: { [category in HighLevelTransactionCategory]?: number } } = {}
    const weeklySpending = {} as { [category in HighLevelTransactionCategory]?: number }
    const monthlySpending = {} as { [category in HighLevelTransactionCategory]?: number }

    // Step 1: Sum amounts per category by day
    for (const transaction of transactions) {
        if (transaction.amount && transaction.date) {
            const amount = parseFloat(transaction.amount)
            const date = new Date(transaction.date)
            const dateKey = date.toISOString().split('T')[0] // Format date as YYYY-MM-DD

            // Only consider transactions that are spending, not income or transfers
            let category: HighLevelTransactionCategory
            if ((transaction.personal_finance_category?.detailed as any).S in HighLevelTransactionCategory) {
                category = (transaction.personal_finance_category?.detailed as any).S ?? ''
            } else {
                category = (transaction.personal_finance_category?.primary as any).S ?? ''
            }
            if (category) {
                // Initialize daily spending map for the date if not present
                if (!dailySpendingMap[dateKey]) {
                    dailySpendingMap[dateKey] = {}
                }
                if (category === 'RENT_AND_UTILITIES_RENT') {
                    console.info(transaction)
                }
                // Aggregate amounts for each category in daily, weekly, and monthly maps
                dailySpendingMap[dateKey][category] = (dailySpendingMap[dateKey][category] || 0) + Math.abs(amount)
                weeklySpending[category] = (weeklySpending[category] || 0) + Math.abs(amount)
                monthlySpending[category] = (monthlySpending[category] || 0) + Math.abs(amount)
            }
        }
    }

    // Convert daily spending map to an array of DailySpendingSummary
    const dailySpendingSummaries: DailySpendingSummary[] = Object.entries(dailySpendingMap).map(([date, spending]) => ({
        date,
        spending,
    }))

    // Step 2: Calculate date range for averages
    const transactionDates = Object.keys(dailySpendingMap).map((date) => new Date(date))
    if (transactionDates.length === 0) {
        throw new Error('No valid transactions found to aggregate.')
    }

    const minDate = new Date(Math.min(...transactionDates.map((date) => date.getTime())))
    const maxDate = new Date(Math.max(...transactionDates.map((date) => date.getTime())))
    const durationInDays = (maxDate.getTime() - minDate.getTime()) / MS_IN_A_DAY

    // Step 3: Calculate weekly and monthly averages
    for (const category of Object.keys(weeklySpending) as HighLevelTransactionCategory[]) {
        if (weeklySpending[category]) weeklySpending[category]! /= durationInDays / 7
        if (monthlySpending[category]) monthlySpending[category]! /= durationInDays / 30
    }

    return {
        daily_spending: dailySpendingSummaries,
        weekly_spending: weeklySpending,
        monthly_spending: monthlySpending,
    }
}

function groupTransactionsByMonth(transactions: Transaction[]): MonthlySpendingAggregates {
    const monthlyAggregates: MonthlySpendingAggregates = {}

    const transactionsByMonth: { [monthYear: string]: Transaction[] } = transactions.reduce((acc, transaction) => {
        if (transaction.date) {
            const date = new Date(transaction.date)
            const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`

            if (!acc[monthYear]) {
                acc[monthYear] = []
            }

            acc[monthYear].push(transaction)
        }
        return acc
    }, {} as { [monthYear: string]: Transaction[] })

    for (const [monthYear, monthTransactions] of Object.entries(transactionsByMonth)) {
        monthlyAggregates[monthYear] = aggregateSpendingByCategory(monthTransactions)
    }

    return monthlyAggregates
}
function getEarliestFirstOfMonthWithin90Days() {
    return new Date(new Date().getTime() - 1000 * 3600 * 24 * 365)
}

export const calculateIncomeAndSpending = async () => {
    // TODO: Add logic to handle last calculated complete month and start from then
    const items = (await decryptItemsInBatches((await client.send(GetItems()))?.Items ?? [])).map(mapDdbResponseToItem)
    /** TODO: Just add created at to the item? */
    const encryptedUserItemRecord = await Promise.all(items.map(async (el) => await client.send(GetUser(el.sk || ''))))
    const decryptedUserItemRecord = (
        await decryptItemsInBatches(encryptedUserItemRecord.flatMap((output) => output.Items ?? []))
    )
        .map(mapDdbResponseToItem)
        .filter((item) => {
            console.info('Processing', item)
            return item.pk && item.created_at
        })
    const ids = decryptedUserItemRecord.map((user) => user.pk?.replace(/#ITEM#\w+/, '') + '#TRANSACTIONS')
    const distinctUsers = [...new Set(ids)]

    /** Go through users and aggregate transactions */
    await processUsersInBatches(distinctUsers as string[])
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
}

async function processUsersInBatches(decryptedUserItemRecord: string[]) {
    const userBatches = chunkArray(decryptedUserItemRecord, 100)
    const now = new Date() // Get the current date and time

    for (const batch of userBatches) {
        await Promise.all(
            batch.map(async (item) => {
                const startDay = getEarliestFirstOfMonthWithin90Days()
                const encryptedTransactions = await client.send(
                    GetEntities({
                        pk: item ?? '',
                        dateRange: {
                            startDay: {
                                day: startDay.getDate() + 1,
                                month: startDay.getMonth() + 1,
                                year: startDay.getFullYear(),
                            },
                            endDay: {
                                day: now.getDate() + 1,
                                month: now.getMonth() + 1,
                                year: now.getFullYear(),
                            },
                            hasNoTimeConstraint: false,
                        },
                        username: '',
                        id: '',
                        entityName: 'TRANSACTION',
                        getAllTransactionsForUser: true,
                    })
                )

                const decryptedTransactions = (await decryptItemsInBatches(encryptedTransactions.Items ?? [])).map(
                    mapDynamoDBToTransaction
                )

                console.info(decryptedTransactions)
                const aggregates = groupTransactionsByMonth(decryptedTransactions)

                await uploadSpendingSummaries(
                    item ?? '',
                    Object.entries(aggregates).flatMap((el) => el[1].daily_spending),
                    aggregates
                )
            })
        )
    }
}
