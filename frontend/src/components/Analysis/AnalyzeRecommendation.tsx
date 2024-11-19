import { useParams } from 'react-router-dom'
import { Divider, Flex, Heading } from '@aws-amplify/ui-react'
import { ConsoleLogger } from 'aws-amplify/utils'
import { generateClient } from 'aws-amplify/api'
import Loader from '../../components/common/Loader'
import { useDataLoading } from '../../hooks/useDataLoading'
import { useAppSelector } from '../../hooks'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import { useEffect, useState } from 'react'
import {
    codeInterperterForAnalysis,
    createAssistant,
    listMessagesForThread,
    runThread,
    uploadFileToAssistant,
} from '../../libs/gpt'
const logger = new ConsoleLogger('AnalyzeRecommendation')

export default function AnalyzeRecommendation() {
    const { name, id } = useParams()
    const client = generateClient()
    const [assistant, setAssistant] = useState<any>(localStorage.getItem('assistant-id'))
    const [investmentFileId, setInvestmentFileId] = useState<any>(localStorage.getItem('investment-file-id'))
    const [transactionFileId, setTransactionFileId] = useState<any>(localStorage.getItem('transactions-file-id'))
    const [accountsFileId, setAccountsFileId] = useState<any>(localStorage.getItem('accounts-file-id'))
    const [threadId, setThreadId] = useState<any>(localStorage.getItem('thread-id'))

    useEffect(() => {
        const createAssistantHelper = async () => {
            if (!assistant) {
                const assistant = await createAssistant()
                setAssistant(assistant.id)
                localStorage.setItem('assistant-id', assistant.id)
            }
            !transactionFileId && uploadTransactions()
            !accountsFileId && uploadAccounts()
            !investmentFileId && uploadInvestments()
        }
        createAssistantHelper()
    }, [assistant, transactionFileId, accountsFileId, investmentFileId])

    const uploadTransactions = async () => {
        const blob = new Blob([JSON.stringify(transactions)], { type: 'application/json' })
        const file = new File([blob], 'transactions.json', { type: 'application/json' })
        const transactionsFile = await uploadFileToAssistant(file)
        setTransactionFileId(transactionsFile.id)
        localStorage.setItem('transactions-file-id', transactionsFile.id)
    }

    useEffect(() => {
        const runAndList = async () => {
            await runThread(threadId, assistant)
            await listMessagesForThread(threadId)
        }
        threadId && assistant && runAndList()
    }, [threadId, assistant])

    const uploadAccounts = async () => {
        const blob = new Blob([JSON.stringify(accounts)], { type: 'application/json' })
        const file = new File([blob], 'accounts.json', { type: 'application/json' })
        const accountsFile = await uploadFileToAssistant(file)
        setAccountsFileId(accountsFile.id)
        localStorage.setItem('accounts-file-id', accountsFile.id)
    }

    const uploadInvestments = async () => {
        const blob = new Blob([JSON.stringify(investments)], { type: 'application/json' })
        const file = new File([blob], 'investments.json', { type: 'application/json' })
        const investmentFile = await uploadFileToAssistant(file)
        setInvestmentFileId(investmentFile.id)
        localStorage.setItem('investment-file-id', investmentFile.id)
    }

    const transactionLoading = useAppSelector((state) => state.transactions.loading)
    const investmentLoading = useAppSelector((state) => state.transactions.loading)
    const accountsLoading = useAppSelector((state) => state.transactions.loading)
    const recommendationsLoading = useAppSelector((state) => state.analysis.loading)
    const recommendations = useAppSelector((state) => state.analysis.fullPictureRecommendations)
    const { investments, accounts, transactions } = useDataLoading({
        id: id || '',
        client,
        loadAccounts: false,
        loadInvestments: false,
        loadRecommendations: false,
        loadTransactions: false,
    })
    const targetRecommendation =
        recommendations && recommendations?.find((recommendation) => recommendation.title === name)

    useEffect(() => {
        const promise =
            investmentFileId &&
            accountsFileId &&
            transactionFileId &&
            assistant &&
            targetRecommendation &&
            !threadId &&
            codeInterperterForAnalysis(
                [investmentFileId, accountsFileId, transactionFileId],
                assistant,
                'I have supplied my recent transactions, investments, and my current holdings. Perform a detailed financial analysis of the possible outcomes of taking the following financial recommendation ' +
                    JSON.stringify(targetRecommendation)
            )
        const setThreadIdHelper = async () => {
            const thread = await promise
            setThreadId(thread.id)
            localStorage.setItem('thread-id', thread.id)
        }
        promise && setThreadIdHelper()
    }, [investmentFileId, accountsFileId, transactionFileId, assistant, targetRecommendation, threadId])
    return (
        <Flex direction="column">
            <Divider />
            <Flex direction="row">
                <Heading level={5}>
                    {(investmentLoading || transactionLoading || accountsLoading || recommendationsLoading) && (
                        <CustomTextBox>
                            <Loader />
                        </CustomTextBox>
                    )}
                </Heading>
            </Flex>
        </Flex>
    )
}
