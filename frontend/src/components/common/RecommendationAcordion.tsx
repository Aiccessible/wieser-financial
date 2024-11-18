import * as Accordion from '../native/Accordion'
import { Heading } from 'lucide-react-native'
import Loader from '../../components/common/Loader'
import React from 'react'
import { Transfer } from '../../libs/gpt'
import { CustomTextBox } from './CustomTextBox'
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
import { Text, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const StyledView = View
const Button = TouchableOpacity

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
    const client = generateClient()
    const isCreatingBudget = useAppSelector((state) => state.budgetSlice.creatingBudget)
    const onAnalyze = (budget: BudgetPlan) => {
        const copyProjections = { ...defaultProjections }
        // current spending in highlevel category - spending threshold
        if (!budget.highLevelCategory || !budget.spendingThreshold) {
            return
        }
        const annualizedSpendingThresholdMultiplier =
            (budget.timeframe === BudgetTimeframe.DAILY
                ? 30
                : budget.timeframe === BudgetTimeframe.MONTHLY
                ? 1
                : budget.timeframe === BudgetTimeframe.WEEKLY
                ? 4
                : 0) * defaultProjections.multipleier
        const initSpending = defaultProjections.annualizedSpendingPerCategory[budget.highLevelCategory ?? '']
        copyProjections.initial_expenses =
            copyProjections.initial_expenses -
            (initSpending - budget.spendingThreshold * annualizedSpendingThresholdMultiplier)
        dispatch(setActiveBudgetPlan(budget.recommendationTitle))
        dispatch(
            getFinancialProjectionForBudget({
                client: client,
                input: copyProjections,
                budgetName: budget.recommendationTitle ?? '',
            })
        )
    }

    const insets = useSafeAreaInsets() // Get safe area insets

    return (
        <ScrollView
            horizontal={true}
            decelerationRate={0}
            snapToInterval={Dimensions.get('screen').width * 0.9} //your element width
            snapToAlignment={'center'}
        >
            {recommendations &&
                recommendations.map((recommendation, index) => (
                    <StyledView
                        key={index}
                        style={{
                            width: Dimensions.get('screen').width * 0.9,
                        }}
                        className="flex-grow bg-transparent py-4  font-medium focus:outline-none text-black dark:placeholder-whiten dark:text-whiten dark:bg-secondary rounded-3xl relative hide-scrollbar w-screen"
                    >
                        <StyledView
                            style={{ backgroundColor: recommendation.priority === 'High' ? '#fe0103' : '#fa8d03' }}
                            className={`absolute top-0 right-0 w-10 h-6 bg-${
                                recommendation.priority === 'High' ? 'danger1' : 'warning1'
                            } rounded-full translate-x-1/4 -translate-y-1/4`}
                        ></StyledView>

                        <CustomTextBox
                            className="w-full hover:text-white-700 hover:underline-offset-2 transition duration-300 ease-in-out text-md font-bold"
                            key={index}
                        >
                            {recommendation.title}
                        </CustomTextBox>
                        <CustomTextBox className="font-normal text-left">
                            {recommendation!.action!.description}
                        </CustomTextBox>
                        <CustomTextBox className="font-normal text-left">{recommendation.explanation}</CustomTextBox>
                        {(recommendation!.action as any).transfers ? (
                            <>
                                {(recommendation!.action as any).transfers?.map((transfer: Transfer, index: number) => (
                                    <StyledView
                                        key={index}
                                        className="flex justify-between items-center bg-gray-100 p-1 rounded-lg mb-1"
                                    >
                                        <StyledView>
                                            <CustomTextBox className="text-sm font-semibold">
                                                From: {transfer!.fromAccountName}
                                            </CustomTextBox>
                                            <CustomTextBox className="text-sm font-semibold">
                                                To: {transfer!.toAccountName}
                                            </CustomTextBox>
                                        </StyledView>
                                        <Text className="text-lg font-semibold text-highlight">
                                            ${transfer!.amount}
                                        </Text>
                                        {loadingTransfer ? (
                                            <Loader />
                                        ) : (
                                            <Button
                                                onPress={() =>
                                                    onClickTransfer(
                                                        transfer as Transfer,
                                                        (recommendation!.action as RecommendationAction)!.description ||
                                                            ''
                                                    )
                                                }
                                                className="bg-primary text-black font-bold ml-2 py-3 px-6 rounded-lg shadow-lg hover:bg-white transition-all duration-500  animate-fade m-0"
                                            >
                                                <Text>Confirm Transfers</Text>
                                            </Button>
                                        )}
                                    </StyledView>
                                ))}
                            </>
                        ) : (recommendation!.action as any).budget ? (
                            <>
                                {(recommendation!.action as TransactionRecommendationAction).budget?.map(
                                    (budget, index) => (
                                        <StyledView
                                            key={index}
                                            className="flex flex-col justify-between items-center bg-gray-200 p-3 rounded-lg mb-4 shadow-md flex-row"
                                        >
                                            <StyledView className="flex flex-col">
                                                <CustomTextBox className="text-base font-semibold text-gray-800">
                                                    Reduce {budget?.highLevelCategory} Spending
                                                </CustomTextBox>
                                                <Text className="text-xl font-bold text-green-600">
                                                    ${budget?.spendingThreshold}
                                                </Text>
                                            </StyledView>
                                            {loadingTransfer ? (
                                                <Loader />
                                            ) : (
                                                <StyledView className="flex flex-col space-y-2">
                                                    {!budgets?.find(
                                                        (budgetInRedux) =>
                                                            budgetInRedux.recommendationTitle === recommendation?.title
                                                    ) ? (
                                                        <Button
                                                            onPress={() => {
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
                                                            className="bg-primary text-black text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-300"
                                                        >
                                                            <Text className="text-black">Start Budget</Text>
                                                        </Button>
                                                    ) : (
                                                        budgets?.find(
                                                            (budgetInRedux) =>
                                                                budgetInRedux.recommendationTitle ===
                                                                recommendation?.title
                                                        ) && (
                                                            <Button className="bg-primary text-black text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-300">
                                                                <Text> Track Progress</Text>
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        onPress={() => {
                                                            const budgetCopy = { ...budget }
                                                            budgetCopy!.recommendationTitle =
                                                                recommendation?.title ?? ''
                                                            budgetCopy && onAnalyze(budgetCopy as any)
                                                        }}
                                                        className="mt-2 bg-secondary text-white text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition duration-300"
                                                    >
                                                        <CustomTextBox>Analyze Impact</CustomTextBox>
                                                    </Button>
                                                </StyledView>
                                            )}
                                        </StyledView>
                                    )
                                )}
                            </>
                        ) : (
                            <></>
                        )}
                    </StyledView>
                ))}
        </ScrollView>
    )
}

export default RecommendationsAccordion
