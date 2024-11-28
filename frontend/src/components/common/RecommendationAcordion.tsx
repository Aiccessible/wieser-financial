import * as Accordion from '@radix-ui/react-accordion'
import { Button, ButtonGroup, Heading } from '@aws-amplify/ui-react'
import Loader from '../../components/common/Loader'
import React from 'react'
import { Transfer } from '../../libs/gpt'
import { CustomTextBox } from './Custom/CustomTextBox'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { setAuthError, getTransferTokenAsync } from '../../features/auth'
import {
    BudgetPlan,
    BudgetTimeframe,
    Recommendation,
    RecommendationAction,
    TransactionRecommendationAction,
} from '../../../src/API'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { getFinancialProjectionForBudget, setActiveBudgetPlan } from '../../../src/features/analysis'
import { generateClient } from 'aws-amplify/api'
import { selectAverageSpendingPerCategory } from '../../../src/features/transactions'
import { addBudget } from '../../../src/features/budgets'
import { adjustSpendingBasedOnBudget } from '../../../src/libs/spendingUtils'

const RecommendationsAccordion = ({ recommendations, id }: { recommendations: Recommendation[]; id: string }) => {
    const loadingTransfer = useAppSelector((state) => state.auth.loadingTransfer)
    const dispatch = useAppDispatch()
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const defaultProjections = useDefaultValuesForProjection({})
    const budgetPlanProjections = useAppSelector((state) => state.analysis.budgetPlanProjections)
    const budgets = useAppSelector((state) => state.budgetSlice.budgets)
    const onClickTransfer = (transfer: Transfer, description: string) => {
        const fromAccount = accounts!.find((it) => it.name === transfer.fromAccountName)
        const toAccount = accounts!.find((it) => it.name === transfer.toAccountName)
        if (!fromAccount) {
            dispatch(setAuthError('Could not find ' + transfer.fromAccountName + ' in accounts'))
            return
        }
        if (!toAccount) {
            dispatch(setAuthError('Could not find ' + transfer.toAccountName + ' in accounts'))
            return
        }
        dispatch(
            getTransferTokenAsync({
                accountId: id,
                metadata: {
                    from_institution_id: id,
                    from_account: fromAccount.account_id!,
                    to_account: toAccount.account_id!,
                    to_institution_id: id,
                    amount: parseFloat(transfer.amount).toFixed(2),
                    legal_name: 'Owen Stadlwieser',
                    description: description.slice(0, 15),
                    currency:
                        accounts!.find((it) => it.name === transfer.fromAccountName)?.balances?.iso_currency_code ||
                        'USD',
                    client_name: accounts!.find((it) => it.name === transfer.fromAccountName)?.name!,
                },
            })
        )
    }
    const averageSpending: Record<string, number> = useAppSelector(selectAverageSpendingPerCategory)
    const client = generateClient()
    const isCreatingBudget = useAppSelector((state) => state.budgetSlice.creatingBudget)
    const onAnalyze = (budget: BudgetPlan) => {
        const copyProjections = adjustSpendingBasedOnBudget(defaultProjections, budget)
        dispatch(setActiveBudgetPlan(budget.recommendationTitle))
        dispatch(
            getFinancialProjectionForBudget({
                client: client,
                input: copyProjections,
                budgetName: budget.recommendationTitle ?? '',
            })
        )
    }
    console.info(budgets)
    return (
        <Accordion.Root className="space-y-4 max-h-[85vh] overflow-auto no-scrollbar hide-scrollbar" type="multiple">
            {recommendations &&
                recommendations.map((recommendation, index) => (
                    <div
                        key={index}
                        className=" flex-grow bg-transparent py-4 pl-9 pr-4 font-medium focus:outline-none text-black dark:placeholder-whiten dark:text-whiten dark:bg-secondary rounded-3xl relative hide-scrollbar"
                    >
                        <div
                            style={{ backgroundColor: recommendation.priority === 'High' ? '#fe0103' : '#fa8d03' }}
                            className={`absolute top-0 right-0 w-10 h-6 bg-${
                                recommendation.priority === 'High' ? 'danger1' : 'warning1'
                            } rounded-full translate-x-1/4 -translate-y-1/4`}
                        ></div>

                        <Heading>
                            <CustomTextBox
                                className=" hover:text-white-700 hover:underline-offset-2 transition duration-300 ease-in-out text-md"
                                key={index}
                            >
                                {recommendation.title}
                            </CustomTextBox>
                        </Heading>
                        <CustomTextBox className="font-normal text-left">
                            {!(recommendation!.action as any)?.budget ? recommendation!.action!.description : ''}
                        </CustomTextBox>
                        <CustomTextBox className="font-normal text-left">{recommendation.explanation}</CustomTextBox>
                        {(recommendation!.action as any).transfers ? (
                            <>
                                {(recommendation!.action as any).transfers?.map((transfer: Transfer, index: number) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center bg-gray-100 p-1 rounded-lg mb-1"
                                    >
                                        <div>
                                            <CustomTextBox className="text-sm font-semibold">
                                                From: {transfer!.fromAccountName}
                                            </CustomTextBox>
                                            <CustomTextBox className="text-sm font-semibold">
                                                To: {transfer!.toAccountName}
                                            </CustomTextBox>
                                        </div>
                                        <p className="text-lg font-semibold text-highlight">${transfer!.amount}</p>
                                        {loadingTransfer ? (
                                            <Loader />
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    onClickTransfer(
                                                        transfer as Transfer,
                                                        (recommendation!.action as RecommendationAction)!.description ||
                                                            ''
                                                    )
                                                }
                                                className="bg-primary text-black font-bold ml-2 py-3 px-6 rounded-lg shadow-lg hover:bg-white transition-all duration-500  animate-fade m-0"
                                            >
                                                Confirm Transfers
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </>
                        ) : (recommendation!.action as any).budget ? (
                            <>
                                {(recommendation!.action as TransactionRecommendationAction).budget?.map(
                                    (budget, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center bg-gray-200 p-3 rounded-lg mb-4 shadow-md"
                                        >
                                            <div className="flex flex-col">
                                                <CustomTextBox className="text-base font-semibold text-gray-800">
                                                    Limit{' '}
                                                    {budget?.highLevelCategory?.toLowerCase().replaceAll('_', ' ')}{' '}
                                                    {budget?.timeframe?.toLowerCase()} Spending
                                                </CustomTextBox>
                                                <p className="text-xl font-bold text-green-600">
                                                    ${budget?.spendingThreshold}
                                                </p>
                                            </div>
                                            {loadingTransfer ? (
                                                <Loader />
                                            ) : (
                                                <ButtonGroup className="flex flex-col space-y-2">
                                                    {!budgets?.find(
                                                        (budgetInRedux) =>
                                                            budgetInRedux.recommendationTitle === recommendation?.title
                                                    ) ? (
                                                        <Button
                                                            onClick={() => {
                                                                const budgetCopy = { ...budget }
                                                                budgetCopy!.recommendationTitle =
                                                                    recommendation?.title ?? ''
                                                                dispatch(
                                                                    addBudget({
                                                                        client,
                                                                        budget: budgetCopy as BudgetPlan,
                                                                    })
                                                                )
                                                            }}
                                                            isLoading={isCreatingBudget}
                                                            className="bg-primary text-black text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-300"
                                                        >
                                                            Start Budget
                                                        </Button>
                                                    ) : (
                                                        budgets?.find(
                                                            (budgetInRedux) =>
                                                                budgetInRedux.recommendationTitle ===
                                                                recommendation?.title
                                                        ) && (
                                                            <Button className="bg-primary text-black text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-300">
                                                                Track Progress
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        onClick={() => {
                                                            const budgetCopy = { ...budget }
                                                            budgetCopy!.recommendationTitle =
                                                                recommendation?.title ?? ''
                                                            budgetCopy && onAnalyze(budgetCopy as any)
                                                        }}
                                                        className="bg-secondary text-white text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition duration-300"
                                                        isLoading={
                                                            (
                                                                budgetPlanProjections?.[
                                                                    recommendation?.title ?? ''
                                                                ] as any
                                                            )?.loading
                                                        }
                                                    >
                                                        Analyze Impact
                                                    </Button>
                                                </ButtonGroup>
                                            )}
                                        </div>
                                    )
                                )}
                            </>
                        ) : (
                            <></>
                        )}
                    </div>
                ))}
        </Accordion.Root>
    )
}

export default RecommendationsAccordion
