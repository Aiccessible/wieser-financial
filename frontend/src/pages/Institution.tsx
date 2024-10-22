import { useParams } from 'react-router-dom'
import { Alert, Button, Divider, Flex, Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from '../components/common/CustomTextBox'
import { ConsoleLogger } from 'aws-amplify/utils'
import { useAppDispatch, useAppSelector } from '../hooks'
import { generateClient } from 'aws-amplify/api'
import { Loader } from 'lucide-react'
import RecommendationsAccordion from '../components/common/RecommendationAcordion'
import { useDataLoading } from '../hooks/useDataLoading'
import { get, post } from 'aws-amplify/api'
import { useState } from 'react'
import { setLoadingTransfer, setTransferToken } from '../features/auth'
import PlaidLink from '../components/PlaidLink'

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
    useDataLoading({
        id: id || '',
        client: client,
        loadAccounts: true,
        loadInvestments: true,
        loadTransactions: true,
        loadRecommendations: true,
    })
    return (
        <Flex direction="column">
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
                    {<RecommendationsAccordion id={id || ''} recommendations={recommendations} />}
                </Heading>
            </Flex>
        </Flex>
    )
}
