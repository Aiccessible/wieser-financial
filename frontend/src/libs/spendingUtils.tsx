import { BudgetPlan, BudgetTimeframe, HighLevelTransactionCategory, SpendingSummary } from '../../src/API'
import { FinancialProjection } from '../components/hooks/useDefaultValuesForProjection'

export const incomeKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('INCOME_'))
export const transferInKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('TRANSFER_IN'))
export const transferOutKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('TRANSFER_OUT'))
export const nonSpendingKeys = [
    ...incomeKeys,
    ...transferInKeys,
    ...transferOutKeys,
    HighLevelTransactionCategory.LOAN_PAYMENTS_CREDIT_CARD_PAYMENT,
]
export const spendingKeys = Object.keys(HighLevelTransactionCategory).filter(
    (key) => !nonSpendingKeys.find((el) => el === key)
)
export function calculateTotalSpendingInCategories(
    spendingSummaries: SpendingSummary[],
    categories: HighLevelTransactionCategory[]
) {
    return spendingSummaries.reduce((totals: Record<string, number>, summary) => {
        Object.entries((summary.spending || {}) as Record<string, number>).forEach(([category, value]) => {
            if (categories.find((el) => el === category)) totals[category] = (totals[category] || 0) + value
        })
        return totals
    }, {})
}

export function calculateTotalsInCategoriesAsTotal(
    summary: SpendingSummary,
    categories: HighLevelTransactionCategory[] = Object.keys(
        HighLevelTransactionCategory
    ) as HighLevelTransactionCategory[]
) {
    let totals = 0
    Object.entries((summary.spending || {}) as Record<string, number>).forEach(([category, value]) => {
        if (categories.find((el) => el === category)) {
            console.log(category, value)
            totals = (totals || 0) + value
        }
    })
    return totals
}
// TODO: This is being called alot
export function calculateTotalSpendingInCategoriesAsTotal(summary: SpendingSummary) {
    let totals = 0
    Object.entries((summary.spending || {}) as Record<string, number>).forEach(([category, value]) => {
        if (!nonSpendingKeys.find((el) => el === category)) {
            console.log(category, value)
            totals = (totals || 0) + value
        }
    })
    return totals
}

export function calculateTotalSpending(spendingSummaries: SpendingSummary[]) {
    return spendingSummaries.reduce((totals: Record<string, number>, summary) => {
        Object.entries((summary.spending || {}) as Record<string, number>).forEach(([category, value]) => {
            if (!nonSpendingKeys.find((el) => el === category)) totals[category] = (totals[category] || 0) + value
        })
        return totals
    }, {})
}

export function calculateAverageSpendingFromMonthlySummarys(
    spendingSummaries: SpendingSummary[],
    includeAll: boolean = false,
    isDailyAverage: boolean = true
): Record<string, number> {
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
            if (!nonSpendingKeys.find((el) => el === category) || includeAll)
                totals[category] = (totals[category] || 0) + (isDailyAverage ? value / numberOfDays : value)
        })
        return totals
    }, {})
}

export const sumBudgetPlan = (budget: BudgetPlan[]) => {
    let totals = 0
    budget.forEach((b) => {
        const annualizedSpendingThresholdMultiplier =
            b.timeframe === BudgetTimeframe.DAILY
                ? 30 * 1
                : b.timeframe === BudgetTimeframe.MONTHLY
                ? 1
                : b.timeframe === BudgetTimeframe.WEEKLY
                ? 4
                : 0
        totals += (b.spendingThreshold ?? 0) * annualizedSpendingThresholdMultiplier
    })
    return totals
}

export const adjustSpendingBasedOnBudget = (defaultProjections: FinancialProjection, budget: BudgetPlan) => {
    const copyProjections = { ...defaultProjections }
    // current spending in highlevel category - spending threshold
    if (!budget.highLevelCategory || !budget.spendingThreshold) {
        return defaultProjections
    }
    const annualizedSpendingThresholdMultiplier =
        budget.timeframe === BudgetTimeframe.DAILY
            ? 30 * 12
            : budget.timeframe === BudgetTimeframe.MONTHLY
            ? 12
            : budget.timeframe === BudgetTimeframe.WEEKLY
            ? 52
            : 0
    const initSpending = defaultProjections.annualizedSpendingPerCategory[budget.highLevelCategory ?? ''] ?? 0

    copyProjections.initial_expenses =
        copyProjections.initial_expenses -
        (initSpending - budget.spendingThreshold * annualizedSpendingThresholdMultiplier)
    return copyProjections
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
