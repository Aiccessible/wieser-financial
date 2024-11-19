import { useAppSelector } from '../../../src/hooks'
import { useMemo } from 'react'
import { calculateAverageSpendingFromMonthlySummarys, daysInMonth } from '../../libs/spendingUtils'
import { calculateAverageTaxRate, identifyAccountType } from '../Analysis/PersonalFinance'
import { reduceAccounts } from '../../../src/features/accounts'
import { HighLevelTransactionCategory } from '../../../src/API'
import { selectRegisteredSavingsPerAccounts } from '../../../src/features/transactions'

export interface FinancialProjection {
    initial_salary: number // Initial income or salary
    salary_growth: number // Annual salary growth rate (as a decimal, e.g., 0.05 for 5%)
    initial_bonus: number // Initial bonus amount
    bonus_growth: number // Annual bonus growth rate (as a decimal)
    initial_expenses: number // Initial expenses (calculated as totalSpending - income - transfersOut)
    expenses_growth: number // Annual expense growth rate (as a decimal)
    investment_yield: number // Expected annual investment yield (as a decimal)
    tax_rate: number // Tax rate (as a decimal, e.g., 0.2 for 20%)
    years: number // Number of years for the projection
    initial_rrsp_balance: number // Initial balance in RRSP account
    initial_fhsa_balance: number // Initial balance in FHSA account
    initial_tfsa_balance: number // Initial balance in TFSA account
    initial_brokerage_balance: number // Initial balance in Brokerage account
    initial_rrsp_room: number // Initial contribution room for RRSP
    initial_fhsa_room: number // Initial contribution room for FHSA
    initial_tfsa_room: number // Initial contribution room for TFSA
    totalSpendingAnnualized: number // Total spending annualized
    incomeAnnualize: number // Annualized income
    transfersOutAnnualized: number // Annualized outgoing transfers
    annualizedSpendingPerCategory: Record<string, number> // Spending broken down by category (e.g., { TRANSPORTATION: 1000, GROCERIES: 2000 })
    multipleier: number // Some custom multiplier value
}
export const financialProjectionKeys = new Set<keyof FinancialProjection>([
    'initial_salary',
    'salary_growth',
    'initial_bonus',
    'bonus_growth',
    'initial_expenses',
    'expenses_growth',
    'investment_yield',
    'tax_rate',
    'years',
    'initial_rrsp_balance',
    'initial_fhsa_balance',
    'initial_tfsa_balance',
    'initial_brokerage_balance',
    'initial_rrsp_room',
    'initial_fhsa_room',
    'initial_tfsa_room',
    'totalSpendingAnnualized',
    'incomeAnnualize',
    'transfersOutAnnualized',
    'annualizedSpendingPerCategory',
    'multipleier',
])

const useDefaultValuesForProjection = ({}: any) => {
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const monthlySpendings = useAppSelector((state) => state.transactions.monthlySummaries)
    const estimatedSavings = useAppSelector(selectRegisteredSavingsPerAccounts)
    return useMemo(() => {
        const averageSpending = calculateAverageSpendingFromMonthlySummarys(monthlySpendings ?? [], true, false)
        const accountBalances = () => {
            const rspInit = accounts?.filter((account) => identifyAccountType(account) === 'RRSP') ?? []
            const tfsa = accounts?.filter((account) => identifyAccountType(account) === 'TFSA') ?? []
            const fhsa = accounts?.filter((account) => identifyAccountType(account) === 'FHSA') ?? []
            const otherAccounts = accounts?.filter(
                (account) => ![...rspInit, ...tfsa, ...fhsa].map((el) => el.name).includes(account?.name)
            )
            return {
                rsp: reduceAccounts(rspInit),
                tfsa: reduceAccounts(tfsa),
                fhsa: reduceAccounts(fhsa),
                others: reduceAccounts(otherAccounts ?? []),
            }
        }
        const numberOfMonthsCompleted =
            (monthlySpendings?.length ?? 1) - 1 + new Date().getDate() / daysInMonth[new Date().getMonth()]
        const multipleier = 12 / numberOfMonthsCompleted
        let annualizedSpendingPerCategory: Record<string, number> = {}
        const totalSpending = Object.entries(averageSpending)
            .map((val) => {
                annualizedSpendingPerCategory[val[0]] = val[1] * multipleier
                return val[1] * multipleier
            })
            .reduce((currVal, val) => currVal + val, 0)
        const transfersOut = Object.keys(averageSpending)
            .filter((key) => key.startsWith('TRANSFER_OUT'))
            .map((key) => {
                return averageSpending[key] * multipleier
            })
            .reduce((currVal, val) => currVal + val, 0)
        const income = () => {
            const incomeKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('INCOME'))
            const transferInKeys = Object.keys(HighLevelTransactionCategory).filter((key) =>
                key.startsWith('TRANSFER_IN')
            )
            const totalIncome = [...incomeKeys, ...transferInKeys].reduce((acc, key) => {
                return acc + (averageSpending[key] ?? 0)
            }, 0)
            return totalIncome * multipleier
        }
        return {
            initial_salary: income(),
            salary_growth: 5 / 100,
            initial_bonus: 0,
            bonus_growth: 0,
            initial_expenses: totalSpending - income() - transfersOut,
            expenses_growth: 5 / 100,
            investment_yield: 15 / 100,
            tax_rate: calculateAverageTaxRate(income(), 'British Columbia') / 100,
            years: 12,
            initial_rrsp_balance: accountBalances().rsp,
            initial_fhsa_balance: accountBalances().fhsa,
            initial_tfsa_balance: accountBalances().tfsa,
            initial_brokerage_balance: accountBalances().others,
            initial_rrsp_room: estimatedSavings?.estimatedRsp ?? 0,
            initial_fhsa_room: estimatedSavings?.estimatedFhsa ?? 0,
            initial_tfsa_room: estimatedSavings?.estimatedTfsa ?? 0,
            totalSpendingAnnualized: totalSpending,
            incomeAnnualize: income(),
            transfersOutAnnualized: transfersOut,
            annualizedSpendingPerCategory,
            multipleier,
        } as FinancialProjection
    }, [accounts, monthlySpendings])
}

export { useDefaultValuesForProjection }
