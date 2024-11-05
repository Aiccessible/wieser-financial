import { useParams } from 'react-router-dom'
import { Alert, Divider, Flex, Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from '../components/common/CustomTextBox'
import { ConsoleLogger } from 'aws-amplify/utils'
import { useAppDispatch, useAppSelector } from '../hooks'
import { generateClient } from 'aws-amplify/api'
import RecommendationsAccordion from '../components/common/RecommendationAcordion'
import { useDataLoading } from '../hooks/useDataLoading'
import { useEffect } from 'react'
import PlaidLink from '../components/PlaidLink'
import { selectNetWorth } from '../features/accounts'
import Accounts from '../components/Accounts'
import { Title } from '@tremor/react'
import { useDefaultValuesForProjection } from '../components/hooks/useDefaultValuesForProjection'
import { NetWorthChart } from '../components/Analysis/NetworthChart'
import Loader from '../components/common/Loader'
import Currency from '../components/Currency'
import * as Accordion from '@radix-ui/react-accordion'
import { RefreshCwIcon } from 'lucide-react'

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
                    <Accordion.Trigger className="flex items-center justify-between w-full px-4  text-lg font-medium bg-gray-800 text-white rounded-t-md">
                        Net Worth
                    </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-4  bg-gray-900 text-white">
                    <div className="flex items-center justify-evenly">
                        <div className="flex flex-col">
                            <Title className="p-1">Net Worth</Title>
                            <Heading level={4} className="text-xl font-semibold  p-1">
                                <CustomTextBox className="text-3xl font-bold tracking-tight  relative">
                                    <Currency amount={netWorth}></Currency>
                                </CustomTextBox>
                            </Heading>
                        </div>
                        <div className="flex flex-col">
                            <Title className="p-1">Estimated Take Home Income</Title>
                            <Heading level={4} className="text-xl font-semibold  p-1">
                                <CustomTextBox className="text-xl font-bold tracking-tight  relative">
                                    <Currency amount={initial_salary}></Currency>
                                </CustomTextBox>
                            </Heading>
                        </div>
                        <div className="flex flex-col">
                            <Title className="p-1">Estimated Annual Expenses</Title>
                            <Heading level={4} className="text-xl font-semibold  p-1">
                                <CustomTextBox className="text-xl font-bold tracking-tight  relative">
                                    <Currency amount={initial_expenses}></Currency>
                                </CustomTextBox>
                            </Heading>
                        </div>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    )
}

export default function Institution() {
    const { id } = useParams()
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
    console.info(netWorths)
    useDataLoading({
        id: id || '',
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
        <Flex direction="column" className="h-full">
            {!transactions?.length && !areTransactionsLoading && (
                <Alert variation="warning">Processing Your account data... This may take a few minutes</Alert>
            )}
            {transferToken && <PlaidLink token={transferToken} onSuccess={() => {}} onExit={() => {}} />}
            {authError && <Alert>{authError}</Alert>}
            <div className="flex flex-col">
                <FinancialAccordion
                    netWorth={netWorth}
                    initial_salary={initial_salary?.toFixed(2)}
                    initial_expenses={initial_expenses?.toFixed(2)}
                />

                <Divider />
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-col max-w-1/2 flex-grow  p-3">
                    {projectedBalances && (
                        <NetWorthChart title="Networth Projection" accountBalances={projectedBalances as any} />
                    )}

                    <Accounts updateAccounts={() => {}} />
                </div>
                <div className="flex w-1/2 flex-grow flex-col">
                    <Heading level={6} className="text-2xl mb-1">
                        <CustomTextBox className="flex flex-row items-center ">
                            Key Insights <RefreshCwIcon className="text-primary ml-4 cursor-pointer" />
                        </CustomTextBox>
                    </Heading>
                    <div className="flex flex-col  scroll-auto">
                        {<RecommendationsAccordion id={id || ''} recommendations={recommendations ?? []} />}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2 bg-gray-800 rounded-lg shadow-lg">
                    <Heading level={5}>
                        {(investmentLoading || transactionLoading || accountsLoading || recommendationsLoading) && (
                            <CustomTextBox>
                                <Loader />
                            </CustomTextBox>
                        )}
                    </Heading>
                </div>

                {/* Right Section (Recommendations Placeholder) */}
                <div className="bg-gray-900 col-span-1 overflow-auto rounded-lg text-white">
                    {/* Your recommendation component goes here */}
                </div>
            </div>
        </Flex>
    )
}
