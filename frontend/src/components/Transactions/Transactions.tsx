import { useEffect } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Title } from '@tremor/react'
import { Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { getTransactionsAsync, getTransactionsRecommendationsAsync } from '../../features/transactions'
import { useDataLoading } from '../../hooks/useDataLoading'
import { DailySpending } from '../common/Spending/DailySpending'
import { SpendingDiff } from '../common/Spending/SpendingDiff'
import { DatePickerCustom } from '../common/DatePicker'
import { SpendingTimeline } from '../common/Spending/SpendingTimeline'
import { RefreshCwIcon } from 'lucide-react'
import RecommendationsAccordion from '../common/RecommendationAcordion'
import ScoreReview from '../common/Spending/SpendingScore'
import { BudgetPlanOverlay } from '../common/Overlay/BudgetPlanOverlay'
import { TransferTimeline } from '../common/Spending/TransferTimeline'
const logger = new ConsoleLogger('Transactions')

export default function Transactions({}) {
    const { id } = useParams()
    const client = generateClient()
    const dispatch = useAppDispatch()
    const loading = useAppSelector((state) => state.transactions.loading)
    const {} = useDataLoading({
        id: id || '',
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
            await dispatch(getTransactionsAsync({ id: id || '', client, append: true }))
        } catch (err) {
            logger.error('unable to get transactions', err)
        }
    }

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <BudgetPlanOverlay />
            <Title>Transactions</Title>
            <div className="flex justify-between">
                <>
                    <div className="flex w-2/3  flex-col relative">
                        <div className="flex w-2/3  flex-row ">
                            <SpendingDiff
                                dailySpending={dailySpendsLastXDays?.[0] ?? ([] as any)}
                                monthlySummaries={monthlySpending ?? []}
                                balancesVisible={areBalancesVisible}
                            />
                            <div className="absolute right-5">
                                <DatePickerCustom />
                            </div>
                        </div>

                        <div className="flex flex-row justify-between">
                            <div className="flex flex-col w-2/3 flex-grow">
                                <div className="flex flex-row  flex-grow max-h-[50vh]   p-3">
                                    <SpendingTimeline spending={monthlySpending ?? []} title={'Monthly Timeline'} />
                                    <DailySpending width={50} />
                                </div>
                                <TransferTimeline spending={monthlySpending ?? []} title={'Transfer Timeline'} />
                                {/**<ScoreReview score={68} change={2} spendingChange={0} avgSpending={0} percentile={0} />*/}
                            </div>
                        </div>
                    </div>
                    <div className="flex w-1/3  flex-col">
                        <Heading level={6} className="text-2xl mb-1">
                            <CustomTextBox className="flex flex-row items-center ">
                                Spending Insights <RefreshCwIcon className="text-primary ml-4 cursor-pointer" />
                            </CustomTextBox>
                        </Heading>
                        <div className="flex flex-col  scroll-auto">
                            {
                                <RecommendationsAccordion
                                    id={id || ''}
                                    recommendations={transactionRecommendations ?? []}
                                />
                            }
                        </div>
                    </div>
                </>
            </div>
        </div>
    )
}
