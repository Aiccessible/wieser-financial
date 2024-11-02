import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { useCallback } from 'react'
import { calculateAverageSpendingFromMonthlySummarys } from '../common/spendingUtils'
import { calculateAverageTaxRate, identifyAccountType } from '../Analysis/PersonalFinance'
import { reduceAccounts } from '../../../src/features/accounts'
import { HighLevelTransactionCategory } from '../../../src/API'

const useDefaultValuesForProjection = () => {
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const monthlySpendings = useAppSelector((state) => state.transactions.monthlySummaries)
    const averageSpending = useCallback(
        () => calculateAverageSpendingFromMonthlySummarys(monthlySpendings ?? [], true),
        [monthlySpendings]
    )

    const accountBalances = useCallback(() => {
        const rspInit = accounts?.find((account) => identifyAccountType(account.name ?? '') === 'RRSP')
        const tfsa = accounts?.find((account) => identifyAccountType(account.name ?? '') === 'TFSA')
        const fhsa = accounts?.find((account) => identifyAccountType(account.name ?? '') === 'FHSA')
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

    const income = useCallback(() => {
        const incomeKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('INCOME'))
        const transferInKeys = Object.keys(HighLevelTransactionCategory).filter((key) => key.startsWith('TRANSFER_IN'))
        const totalIncome = [...incomeKeys, ...transferInKeys].reduce((acc, key) => {
            return acc + (averageSpending()[key] ?? 0)
        }, 0)
        return totalIncome * 12
    }, [averageSpending])
    console.log(433454, income())
    return {
        initial_salary: income(),
        salary_growth: 5,
        initial_bonus: 0,
        bonus_growth: 0,
        initial_expenses: Object.values(averageSpending()).reduce((currVal, val) => currVal + val, 0) - income(),
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
