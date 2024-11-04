import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { useCallback, useMemo } from 'react'
import { calculateAverageSpendingFromMonthlySummarys, daysInMonth } from '../common/spendingUtils'
import { calculateAverageTaxRate, identifyAccountType } from '../Analysis/PersonalFinance'
import { reduceAccounts } from '../../../src/features/accounts'
import { Account, HighLevelTransactionCategory, SpendingSummary } from '../../../src/API'
import { selectRegisteredSavingsPerAccounts } from '../../../src/features/transactions'

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
            (monthlySpendings?.length ?? 1) + new Date().getDate() / daysInMonth[new Date().getMonth()]
        const totalSpending = Object.values(averageSpending)
            .map((val) => {
                return val * (12 / numberOfMonthsCompleted)
            })
            .reduce((currVal, val) => currVal + val, 0)
        const transfersOut = Object.keys(averageSpending)
            .filter((key) => key.startsWith('TRANSFER_OUT'))
            .map((key) => {
                return averageSpending[key] * (12 / numberOfMonthsCompleted)
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
            return totalIncome * (12 / numberOfMonthsCompleted)
        }
        console.log(433454, income)
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
        }
    }, [accounts, monthlySpendings])
}

export { useDefaultValuesForProjection }
