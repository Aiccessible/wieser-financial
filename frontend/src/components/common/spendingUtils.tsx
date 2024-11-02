import { HighLevelTransactionCategory, SpendingSummary } from '../../../src/API'
import { CustomTextBox } from './CustomTextBox'
import { useCallback } from 'react'

const incomeKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('INCOME_'))
const transferInKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('TRANSFER_IN'))
const transferOutKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('TRANSFER_OUT'))
export const nonSpendingKeys = [...incomeKeys, ...transferInKeys, ...transferOutKeys]
export function calculateTotalSpending(spendingSummaries: SpendingSummary[]) {
    return spendingSummaries.reduce((totals: Record<string, number>, summary) => {
        Object.entries((summary.spending || {}) as Record<string, number>).forEach(([category, value]) => {
            if (!(category in nonSpendingKeys)) totals[category] = (totals[category] || 0) + value
        })
        return totals
    }, {})
}

export function calculateAverageSpendingFromMonthlySummarys(
    spendingSummaries: SpendingSummary[],
    includeAll: boolean = false,
    isDailyAverage: boolean = true
): Record<string, number> {
    console.log('calculation')
    return spendingSummaries.reduce((totals: Record<string, number>, summary) => {
        const dateOfSummary = new Date((summary as any).date)
        const currentDate = new Date()
        let numberOfDays = 1
        if (
            dateOfSummary.getMonth() === currentDate.getMonth() &&
            dateOfSummary.getFullYear() === currentDate.getFullYear()
        ) {
            numberOfDays = currentDate.getDate()
        } else {
            numberOfDays = daysInMonth[dateOfSummary.getMonth()]
        }
        Object.entries((summary.spending || {}) as Record<string, number>).forEach(([category, value]) => {
            if (!(category in nonSpendingKeys) || includeAll)
                totals[category] = (totals[category] || 0) + (isDailyAverage ? value / numberOfDays : value)
        })
        return totals
    }, {})
}

export const daysInMonth: Record<number, number> = {
    0: 31,
    1: 28,
    2: 31,
    3: 30,
    4: 31,
    5: 30,
    6: 31,
    7: 31,
    8: 30,
    9: 31,
    10: 30,
    11: 31,
}
