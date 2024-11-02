import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { useCallback } from 'react'
import { calculateAverageSpendingFromMonthlySummarys, daysInMonth } from '../common/spendingUtils'
import { calculateAverageTaxRate, identifyAccountType } from '../Analysis/PersonalFinance'
import { reduceAccounts } from '../../../src/features/accounts'
import { HighLevelTransactionCategory } from '../../../src/API'

const useDefaultValuesForProjection = () => {
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const monthlySpendings = useAppSelector((state) => state.transactions.monthlySummaries)
    const averageSpending = useCallback(
        () => calculateAverageSpendingFromMonthlySummarys(monthlySpendings ?? [], true, false),
        [monthlySpendings]
    )

    const accountBalances = useCallback(() => {
        const rspInit = accounts?.find((account) => identifyAccountType(account) === 'RRSP')
        const tfsa = accounts?.find((account) => identifyAccountType(account) === 'TFSA')
        const fhsa = accounts?.find((account) => identifyAccountType(account) === 'FHSA')
        const otherAccounts = accounts?.filter(
            (account) => ![rspInit?.name, tfsa?.name, fhsa?.name].includes(account?.name)
        )
        return {
            rsp: parseFloat(rspInit?.balances?.current ?? '0'),
            tfsa: parseFloat(tfsa?.balances?.current ?? '0'),
            fhsa: parseFloat(fhsa?.balances?.current ?? '0'),
            others: reduceAccounts(otherAccounts ?? []),
        }
    }, [accounts])
    const numberOfMonthsCompleted =
        (monthlySpendings?.length ?? 1) + new Date().getDate() / daysInMonth[new Date().getMonth()]
    const totalSpending = useCallback(() => {
        return Object.values(averageSpending())
            .map((val) => {
                return val * (12 / numberOfMonthsCompleted)
            })
            .reduce((currVal, val) => currVal + val, 0)
    }, [averageSpending])
    const transfersOut = useCallback(() => {
        return Object.keys(averageSpending())
            .filter((key) => key.startsWith('TRANSFER_OUT'))
            .map((key) => {
                return averageSpending()[key] * (12 / numberOfMonthsCompleted)
            })
            .reduce((currVal, val) => currVal + val, 0)
    }, [averageSpending])
    const income = useCallback(() => {
        const incomeKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('INCOME'))
        const transferInKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('TRANSFER_IN'))
        const totalIncome = [...incomeKeys, ...transferInKeys].reduce((acc, key) => {
            return acc + (averageSpending()[key] ?? 0)
        }, 0)
        console.log(totalIncome, '435454', numberOfMonthsCompleted)
        return totalIncome * (12 / numberOfMonthsCompleted)
    }, [averageSpending])
    console.log(433454, income())
    return {
        initial_salary: income(),
        salary_growth: 5,
        initial_bonus: 0,
        bonus_growth: 0,
        initial_expenses: totalSpending() - income() - transfersOut(),
        expenses_growth: 5,
        investment_yield: 15,
        tax_rate: calculateAverageTaxRate(income(), 'British Columbia'),
        years: 12,
        initial_rrsp_balance: accountBalances().rsp,
        initial_fhsa_balance: accountBalances().fhsa,
        initial_tfsa_balance: accountBalances().tfsa,
        initial_brokerage_balance: accountBalances().others,
        initial_rrsp_room: 0,
        initial_fhsa_room: 0,
        initial_tfsa_room: 0,
    }
}

export { useDefaultValuesForProjection }
