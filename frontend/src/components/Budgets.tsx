import { ConsoleLogger } from 'aws-amplify/utils'
import { Button, Heading } from '@aws-amplify/ui-react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { CustomTextBox } from './common/Custom/CustomTextBox'
import { View } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { getBudgetRecommendationsAsync } from '../features/transactions'
import { generateClient } from 'aws-amplify/api'
import {
    adjustSpendingBasedOnBudget,
    calculateAverageSpendingFromMonthlySummarys,
    calculateTotalsInCategoriesAsTotal,
    sumBudgetPlan,
} from '../libs/spendingUtils'
import BudgetComparison from './BudgetComparison'
import { getFinancialProjectionForBudget } from '../features/analysis'
import { FinancialProjection, useDefaultValuesForProjection } from './hooks/useDefaultValuesForProjection'
import Currency from './common/Custom/Currency'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { addBudget } from '../features/budgets'
import { BudgetPlan, SpendingSummary } from '../API'

const logger = new ConsoleLogger('Accounts')

export default function Budgets({}) {
    const budgets = useAppSelector((state) => state.budgetSlice.budgets)
    const loading = useAppSelector((state) => state.budgetSlice.loading)
    const monthlySpending = useAppSelector((state) => state.transactions.monthlySummaries)
    const spendingWithoutCurrent = monthlySpending?.slice(1)
    const dispatch = useAppDispatch()
    const client = generateClient()
    const recommendedBudgets = useAppSelector((state) => state.transactions.budgetRecommendations)
    const averageSpending = calculateAverageSpendingFromMonthlySummarys(spendingWithoutCurrent ?? [], true, false)
    const defaultProjections = useDefaultValuesForProjection({})
    const budgetProjections = useAppSelector((state) => state.analysis.budgetPlanProjections)
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)
    const loadingBudget = useAppSelector((state) => state.budgetSlice.creatingBudget)
    const [recommendedProjection, setRecommendedProjection] = useState<FinancialProjection | undefined>(undefined)
    useEffect(() => {
        if (!loading && !budgets?.length) {
            dispatch(
                getBudgetRecommendationsAsync({
                    client: client,
                    ids: [],
                    append: false,
                })
            )
        }
    }, [loading, budgets])

    useEffect(() => {
        if (recommendedBudgets && defaultProjections?.annualizedSpendingPerCategory) {
            const budgets = recommendedBudgets.flatMap((budget) => (budget.action as any)?.budget)
            let copyProjections = defaultProjections
            budgets.forEach((budget) => {
                copyProjections = adjustSpendingBasedOnBudget(copyProjections, budget)
            })
            setRecommendedProjection(copyProjections ?? undefined)

            dispatch(
                getFinancialProjectionForBudget({
                    client: client,
                    input: copyProjections,
                    budgetName: 'RecommendedBudget',
                })
            )
        }
    }, [recommendedBudgets, defaultProjections])

    useEffect(() => {
        if (budgets && defaultProjections?.annualizedSpendingPerCategory) {
            let copyProjections = defaultProjections
            budgets.forEach((budget) => {
                copyProjections = adjustSpendingBasedOnBudget(copyProjections, budget)
            })
            setRecommendedProjection(copyProjections ?? undefined)

            dispatch(
                getFinancialProjectionForBudget({
                    client: client,
                    input: copyProjections,
                    budgetName: 'CurrentBudget',
                })
            )
        }
    }, [budgets, defaultProjections])

    const getBudgetTotal = useCallback(() => {
        if (budgets) {
            return sumBudgetPlan(budgets)
        } else {
            return sumBudgetPlan(recommendedBudgets?.flatMap((el) => (el.action as any)?.budget) ?? [])
        }
    }, [budgets, recommendedBudgets])
    const budgetRecommendationKey = !budgets?.length ? 'RecommendedBudget' : 'CurrentBudget'
    const budgetDifference =
        calculateTotalsInCategoriesAsTotal((monthlySpending?.[0]?.spending as any) ?? {}) - getBudgetTotal()
    const isOverBudget = budgetDifference > 0
    return (
        <div className="flex w-1/2 flex-grow flex-col max-h-[35vh] overflow-auto hide-scrollbar">
            <Heading level={6} className="text-2xl mb-1 flex flex-row justify-between">
                <CustomTextBox className="flex flex-row items-center ">Budget</CustomTextBox>
                <>
                    {!budgets?.length && recommendedBudgets && (
                        <Button
                            onClick={() => {
                                const budgets = recommendedBudgets.flatMap((budget) => (budget.action as any)?.budget)
                                budgets.forEach((budget: BudgetPlan) => {
                                    dispatch(
                                        addBudget({
                                            client,
                                            budget: { ...budget, recommendationTitle: budget.highLevelCategory },
                                        })
                                    )
                                })
                            }}
                            className="bg-primary primary border-white text-black text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 ease-in-out transition duration-300 ml-2"
                            isLoading={loadingBudget}
                        >
                            Start Wieser Budget
                        </Button>
                    )}
                </>
            </Heading>
            <CustomTextBox
                className={`flex flex-col  space-x-2 px-4 py-2 rounded-md ${
                    isOverBudget ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
                }`}
            >
                {budgetProjections[budgetRecommendationKey] &&
                    (budgetProjections[budgetRecommendationKey] as any)['Net Worth'] &&
                    recommendedProjection &&
                    projectedBalances?.['Net Worth']?.[6] && (
                        <>
                            <p
                                className={
                                    isOverBudget
                                        ? 'text-red-700 flex flex-row font-bold'
                                        : 'text-green-700 flex flex-row font-bold'
                                }
                            >
                                <DollarSign style={{ marginRight: '8px' }} />
                                <Currency
                                    amount={
                                        defaultProjections.initial_expenses - recommendedProjection?.initial_expenses
                                    }
                                />{' '}
                                saved annually
                            </p>
                            <p
                                style={{ marginLeft: 0 }}
                                className={
                                    isOverBudget
                                        ? 'text-red-700 flex flex-row font-bold'
                                        : 'text-green-700 flex flex-row font-bold'
                                }
                            >
                                <TrendingUp style={{ marginRight: '8px' }} />
                                <Currency
                                    amount={
                                        (budgetProjections[budgetRecommendationKey] as any)['Net Worth']?.[6] -
                                        projectedBalances?.['Net Worth']?.[6]
                                    }
                                />{' '}
                                added to NetWorth in 5 years
                            </p>
                        </>
                    )}
                {monthlySpending && (budgets || recommendedBudgets) ? (
                    <div style={{ marginLeft: 0 }} className="flex flex-row">
                        {isOverBudget ? (
                            <TrendingUp style={{ marginRight: '8px' }} className="text-red-700" />
                        ) : (
                            <TrendingDown style={{ marginRight: '8px' }} className="text-green-700" />
                        )}
                        <p className={isOverBudget ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                            {' '}
                            <Currency amount={Math.abs(budgetDifference)} />
                            {isOverBudget ? ' Over your budget' : ' Under your budget'}
                        </p>
                    </div>
                ) : null}
            </CustomTextBox>
            {/** Total Savings */}
            {/** Net Worth Benefits */}
            {/** Reductions per category */}
            {budgets?.length ? (
                <BudgetComparison isRecommended={false} budgets={budgets} averageSpending={averageSpending} />
            ) : recommendedBudgets ? (
                <>
                    {
                        <BudgetComparison
                            isRecommended={true}
                            budgets={recommendedBudgets.flatMap((budget) => (budget.action as any)?.budget)}
                            averageSpending={(monthlySpending?.[0]?.spending as any) ?? {}}
                        />
                    }
                    {/** Total Savings */}
                    {/** Net Worth Benefits */}
                    {/** Reductions per category */}
                </>
            ) : (
                <></>
            )}
        </div>
    )
}
