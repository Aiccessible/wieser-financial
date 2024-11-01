import { useParams } from 'react-router-dom'
import { Alert, Button, Divider, Flex, Heading } from '@aws-amplify/ui-react'
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
import { MonthlySpending } from '../components/common/MonthlySpending'
import { useDefaultValuesForProjection } from '../components/hooks/useDefaultValuesForProjection'
import { getFinancialProjection } from '../features/analysis'
import { NetWorthChart } from '../components/Analysis/NetworthChart'
import WelcomePage from '../components/WelcomePage'
import Loader from '../components/common/Loader'
const logger = new ConsoleLogger('Instituions')

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
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const netWorth = useAppSelector(selectNetWorth)
    const transactions = useAppSelector((state) => state.transactions.transactions)
    const areTransactionsLoading = useAppSelector((state) => state.transactions.loading)
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)

    useDataLoading({
        id: id || '',
        client: client,
        loadAccounts: true,
        loadInvestments: true,
        loadTransactions: true,
        loadRecommendations: true,
        loadProjection: true,
    })
    console.log(transactions?.length, areTransactionsLoading)
    return (
        <Flex direction="column" className="h-100">
            {!transactions?.length && !areTransactionsLoading && (
                <Alert variation="warning">Processing Your account data... This may take a few minutes</Alert>
            )}
            {transferToken && <PlaidLink token={transferToken} onSuccess={() => {}} onExit={() => {}} />}
            {authError && <Alert>{authError}</Alert>}
            <Divider />

            <Flex direction="row">
                <Heading level={5}>
                    {(investmentLoading || transactionLoading || accountsLoading || recommendationsLoading) && (
                        <CustomTextBox>
                            <Loader />
                        </CustomTextBox>
                    )}
                </Heading>
                <div className="col-span-2 bg-gray-800 rounded-lg shadow-lg">
                    <Title className="p-2">Net Worth</Title>
                    <Heading level={4} className="text-xl font-semibold mb-4 p-2">
                        <CustomTextBox className="text-4xl font-bold tracking-tight text-white relative">
                            <CustomTextBox className="relative z-10">{netWorth?.toFixed(2) ?? '...'}$</CustomTextBox>
                        </CustomTextBox>
                    </Heading>
                    {projectedBalances && (
                        <NetWorthChart title="Networth Projection" accountBalances={projectedBalances as any} />
                    )}
                    <Accounts updateAccounts={() => {}} />
                </div>

                {/* Right Section (Recommendations Placeholder) */}
                <div className="bg-gray-900 flex-grow overflow-auto rounded-lg text-white">
                    <Heading className="text-lg mb-4">
                        <CustomTextBox>Key Insights</CustomTextBox>
                    </Heading>
                    {<RecommendationsAccordion id={id || ''} recommendations={recommendations ?? []} />}
                    {/* Your recommendation component goes here */}
                    <MonthlySpending width={100} />
                </div>
            </Flex>
        </Flex>
    )
}
