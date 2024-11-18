import { useEffect } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { CustomTextBox } from './common/CustomTextBox'
import { useAppDispatch, useAppSelector } from '../hooks'
import { getTransactionsAsync, getTransactionsRecommendationsAsync } from '../features/transactions'
import { useDataLoading } from '../hooks/useDataLoading'
import { DailySpending } from './common/DailySpending'
import { SpendingDiff } from './common/SpendingDiff'
import { DatePickerCustom } from './common/DatePicker'
import { SpendingTimeline } from './common/SpendingTimeline'
import { RefreshCw } from 'lucide-react-native'
import RecommendationsAccordion from './common/RecommendationAcordion'
import ScoreReview from './common/SpendingScore'
import { BudgetPlanOverlay } from './common/BudgetPlanOverlay'
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import * as Accordion from '../components/native/Accordion'

const logger = new ConsoleLogger('Transactions')

export default function Transactions({}) {
    const client = generateClient()
    const dispatch = useAppDispatch()
    const loading = useAppSelector((state) => state.transactions.loading)
    const {} = useDataLoading({
        id: 'v0',
        client,
        loadTransactions: true,
        loadAccounts: true,
        loadProjection: true,
        loadBudgets: true,
    })
    const institutions = useAppSelector((state) => state.idsSlice.institutions)
    const dailySpendsLastXDays = useAppSelector((state) => state.transactions.dailySummaries)
    const monthlySpending = useAppSelector((state) => state.transactions.monthlySummaries)
    const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)
    const transactionRecommendations = useAppSelector((state) => state.transactions.transactionRecommendations)
    useEffect(() => {
        institutions?.length &&
            dispatch(
                getTransactionsRecommendationsAsync({
                    client: client,
                    ids: institutions?.map((account) => account?.item_id) ?? [],
                    append: false,
                })
            )
    }, [institutions?.length])
    const handleLoadMore = async () => {
        try {
            await dispatch(getTransactionsAsync({ id: 'v0', client, append: true }))
        } catch (err) {
            logger.error('unable to get transactions', err)
        }
    }

    return (
        <View className="bg-black     px-4 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <BudgetPlanOverlay />
            <ScrollView className="flex  bg-black">
                <>
                    <View className="flex   flex-col relative">
                        <View style={{ width: Dimensions.get('screen').width }} className="flex flex-1">
                            <SpendingDiff
                                dailySpending={dailySpendsLastXDays?.[0] ?? ([] as any)}
                                monthlySummaries={monthlySpending ?? []}
                                balancesVisible={areBalancesVisible}
                            />
                        </View>
                        <View
                            className="flex flex-1  flex-row "
                            style={{
                                width: Dimensions.get('screen').width,
                                height: Dimensions.get('screen').height * 0.35,
                            }}
                        >
                            <DailySpending width={50} />
                        </View>

                        <View className="flex flex-row justify-between">
                            <View className="flex flex-col  flex-grow">
                                <View className="flex flex-col  flex-grow max-h-[50vh]   p-3">
                                    <SpendingTimeline spending={monthlySpending ?? []} title={'Monthly Spending'} />
                                </View>
                            </View>
                        </View>
                    </View>
                    <View className="flex w-full  flex-col">
                        <Text>
                            <CustomTextBox className="flex flex-row items-center font-semibold">
                                Spending Insights <RefreshCw className="text-primary ml-4 cursor-pointer" />
                            </CustomTextBox>
                        </Text>
                        <View className="flex flex-col  scroll-auto">
                            {<RecommendationsAccordion id={'v0'} recommendations={transactionRecommendations ?? []} />}
                        </View>
                        <ScoreReview score={68} change={2} spendingChange={0} avgSpending={0} percentile={0} />
                    </View>
                </>
            </ScrollView>
        </View>
    )
}
