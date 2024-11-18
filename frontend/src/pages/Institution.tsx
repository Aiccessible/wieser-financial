import { StatusBar, Text, View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { CustomTextBox } from '../components/common/CustomTextBox'
import { ConsoleLogger } from 'aws-amplify/utils'
import { useAppSelector } from '../hooks'
import { generateClient } from 'aws-amplify/api'
import RecommendationsAccordion from '../components/common/RecommendationAcordion'
import { useDataLoading } from '../hooks/useDataLoading'
import PlaidLink from '../components/PlaidLink'
import { selectNetWorth } from '../features/accounts'
import Accounts from '../components/Accounts'
import { useDefaultValuesForProjection } from '../components/hooks/useDefaultValuesForProjection'
import { NetWorthChart } from '../components/Analysis/NetworthChart'
import Loader from '../components/common/Loader'
import Currency from '../components/Currency'
import * as Accordion from '../components/native/Accordion'
import { RefreshCw } from 'lucide-react-native'
import StockSummary from '../components/StockSummary'
import { cssInterop } from 'nativewind'
import ScoreIndicators from '../components/Scores'

const StyledView = View
const StyledText = Text
const RefreshCwStyled = cssInterop(RefreshCw, {
    className: 'style',
})
const logger = new ConsoleLogger('Instituions')

interface FinancialAccordionProps {
    netWorth: string
    initial_salary: string
    initial_expenses: string
}

const FinancialAccordion: React.FC<FinancialAccordionProps> = ({ netWorth, initial_salary, initial_expenses }) => {
    return (
        <Accordion.Root type="single" collapsible className="w-full">
            {/* Net Worth Section */}
            <Accordion.Item value="item-1">
                <Accordion.Header>
                    <Accordion.Trigger
                        asChild
                        className="flex  justify-between w-full px-4  text-lg font-medium bg-gray-800 text-white rounded-t-md"
                    >
                        <TouchableOpacity>
                            <Text className="text-primary">Net Worth</Text>
                        </TouchableOpacity>
                    </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-4 bg-gray-900 text-white">
                    <StyledView className="flex  justify-evenly ">
                        <StyledView className="flex flex-col">
                            <Text>
                                <CustomTextBox className="text-3xl font-bold tracking-tight  relative">
                                    <Currency amount={netWorth}></Currency>
                                </CustomTextBox>
                            </Text>
                        </StyledView>
                        <StyledView className="flex flex-col">
                            <Text className="text-primary">Estimated Take Home Income</Text>
                            <Text>
                                <CustomTextBox className="text-xl font-bold tracking-tight  relative">
                                    <Currency amount={initial_salary}></Currency>
                                </CustomTextBox>
                            </Text>
                        </StyledView>
                        <StyledView className="flex flex-col">
                            <Text className="text-primary">Estimated Annual Expenses</Text>
                            <Text>
                                <CustomTextBox className="text-xl font-bold tracking-tight  relative">
                                    <Currency amount={initial_expenses}></Currency>
                                </CustomTextBox>
                            </Text>
                        </StyledView>
                    </StyledView>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    )
}

export default function Institution() {
    const client = generateClient()
    const transactionLoading = useAppSelector((state) => state.transactions.loading)
    const investmentLoading = useAppSelector((state) => state.transactions.loading)
    const accountsLoading = useAppSelector((state) => state.transactions.loading)
    const recommendations = useAppSelector((state) => state.analysis.fullPictureRecommendations)
    const recommendationsLoading = useAppSelector((state) => state.analysis.loading)
    const transferToken = useAppSelector((state) => state.auth.transferToken)
    const authError = useAppSelector((state) => state.auth.error)
    const netWorth = useAppSelector(selectNetWorth)
    const transactions = useAppSelector((state) => state.transactions.transactions)
    const areTransactionsLoading = useAppSelector((state) => state.transactions.loading)
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)
    const netWorths = useAppSelector((state) => state.netWorthSlice.networths)
    useDataLoading({
        id: 'v0',
        client: client,
        loadAccounts: true,
        loadInvestments: true,
        loadTransactions: true,
        loadRecommendations: true,
        loadProjection: true,
        loadNetworths: true,
        loadTopStockAnalysis: true,
    })
    const { initial_salary, initial_expenses } = useDefaultValuesForProjection({})
    return (
        <ScrollView className="bg-black">
            <ScoreIndicators />

            {!transactions?.length && !areTransactionsLoading && <StatusBar></StatusBar>}
            {transferToken && <PlaidLink token={transferToken} onSuccess={() => {}} onExit={() => {}} />}
            {authError && <StatusBar animated></StatusBar>}
            <StyledView className="flex flex-row items-center " style={{ marginTop: 25, marginHorizontal: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'left' }} className="text-white">
                    Networth Projection
                </Text>
                <FinancialAccordion
                    netWorth={netWorth}
                    initial_salary={initial_salary?.toFixed(2)}
                    initial_expenses={initial_expenses?.toFixed(2)}
                />
            </StyledView>
            <StyledView className="flex flex-col justify-between">
                <StyledView className="flex flex-col max-w-2/3 flex-grow  p-3 relative">
                    {projectedBalances && (
                        <NetWorthChart title="Networth Projection" accountBalances={projectedBalances as any} />
                    )}
                    <StyledView className="flex  flex-col">
                        <View className="flex flex-row">
                            <CustomTextBox className="items-center text-2xl mb-1">Key Insights</CustomTextBox>
                            <RefreshCwStyled className="text-primary ml-4 cursor-pointer" />
                        </View>

                        <StyledView className="flex flex-col  scroll-auto">
                            {<RecommendationsAccordion id={'v0'} recommendations={recommendations ?? []} />}
                        </StyledView>
                    </StyledView>
                    <StyledView className="flex flex-row">
                        <Accounts dontGrow={true} />
                        <StockSummary />
                    </StyledView>
                </StyledView>
            </StyledView>
            <StyledView className="grid grid-cols-4 gap-4">
                <StyledView className="col-span-2 bg-gray-800 rounded-lg shadow-lg">
                    <Text>
                        {(investmentLoading || transactionLoading || accountsLoading || recommendationsLoading) && (
                            <CustomTextBox>
                                <Loader />
                            </CustomTextBox>
                        )}
                    </Text>
                </StyledView>
            </StyledView>
        </ScrollView>
    )
}
