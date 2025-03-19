import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { sendChatToLLM, setLoadingChat } from '../../features/chat'
import { generateClient } from 'aws-amplify/api'
import { Chat, ChatFocus, HighLevelTransactionCategory } from '../../API'
import { onCreateChat } from '../../graphql/subscriptions'
import { fetchAuthSession } from 'aws-amplify/auth'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTransition, animated, config } from 'react-spring'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { setActiveSimulationParams, setActiveSimulationS3Params } from '../../../src/features/analysis'
import Currency from '../common/Custom/Currency'
import AgentConversation, { LoadingStates } from './ai-chat'
import useConversationHook from '../../../src/hooks/useConversation'
import { ModelOption } from '../ui/model-selector'

export async function custom_headers() {
    const accessToken = (await fetchAuthSession()).tokens?.accessToken?.toString()
    return { Authorization: `Bearer ${accessToken}` }
}
interface SidebarProps {
    isSidebarOpen: boolean
    setIsSidebarOpen: (arg: boolean) => void
    activeTab: string
}

const Chatbar = ({ isSidebarOpen, setIsSidebarOpen, activeTab }: SidebarProps) => {
    const dispatch = useAppDispatch()
    const isChatLoading = useAppSelector((state) => state.chat.loadingChat)
    const chatFocus = useAppSelector((state) => state.chat.currentScope)
    const highLevelCategory = useAppSelector((state) => state.chat.highLevelSpendingCategory)
    const currentDateRange = useAppSelector((state) => state.chat.currentDateRange)
    const client = generateClient()
    const [chunks, setChunks] = useState<Chat[]>()
    const [lastRecievedChat, setLastReceivedChat] = useState(0)
    const ids = useAppSelector((state) => state.idsSlice.institutions?.map((el) => el.item_id))
    const projection = useDefaultValuesForProjection({})

    const getSortedChunks = useMemo(() => {
        const chunksOfConcern = chunks
        chunksOfConcern?.sort((a, b) => (parseInt(a.sk || '') || 0) - parseInt(b.sk || ''))
        return chunksOfConcern?.map((chunks) => chunks.message).join('')
    }, [chunks])

    useEffect(() => {
        const createSub = async () => {
            const headers = await custom_headers()
            client
                .graphql(
                    {
                        query: onCreateChat,
                        variables: {
                            pk: (await fetchAuthSession()).userSub || '',
                        },
                    },
                    headers
                )
                .subscribe({
                    next: ({ data }) => {
                        const chunk = data.onCreateChat
                        console.info('Chunk is', chunk)
                        if (chunk.sk === 'SimulationPreExpansionMessage') {
                            const message = JSON.parse(chunk.message ?? '')
                            dispatch(setActiveSimulationParams({ simulationExpansion: message }))
                        }
                        if (chunk.sk === 'SimulationExpansionMessage') {
                            const message = JSON.parse(chunk.message ?? '')
                            dispatch(setActiveSimulationS3Params({ simulationExpansion: message }))
                        }
                        if (chunk.sk === 'FinancialSimulationRepair') {
                            console.info('Repaired', chunk.message)
                            const message = JSON.parse(chunk.message ?? '')
                            dispatch(setActiveSimulationS3Params({ simulationExpansion: message }))
                        }
                        if (chunk.isLastChunk) {
                            dispatch(setLoadingChat(false))
                            setChunks([])
                            return
                        }
                        setLastReceivedChat(Date.now())
                        setChunks((prevState: Chat[] | undefined) => {
                            return [...(prevState ?? []), chunk]
                        })
                    },
                    error: (error) => console.warn(error),
                })
        }
        createSub()
    }, [])
    const [inputValue, setInputValue] = useState<string>('') // For handling input state

    const sendChat = (input: string, focus: ChatFocus) => {
        console.info(input, 'vjskkcsadsdajskc')

        dispatch(
            sendChatToLLM({
                newChat: input,
                client,
                focus,
                ids: ids ?? [],
                highLevelSpendingCategory: highLevelCategory,
                currentDateRange,
                projection,
            })
        )
        setInputValue('') // Clear input after submission
    }

    const handleChatSubmit = (e: React.FormEvent) => {
        setChunks([])
        e.preventDefault()
        if (!inputValue.trim()) return // Prevent sending empty messages
        console.info(inputValue, 'vjskkcjskc')
        // Determine ChatFocus based on URL path
        const focus = window.location.pathname.includes('accounts')
            ? ChatFocus.Accounts
            : window.location.pathname.includes('transactions')
            ? ChatFocus.Transaction
            : window.location.pathname.includes('investments')
            ? ChatFocus.Investment
            : ChatFocus.All
        sendChat(inputValue, focus)
    }

    const stillGettingChats = lastRecievedChat > Date.now() - 1000 * 4
    const chats = useAppSelector((state) => state.chat.chats)
    const transitions = useTransition(isSidebarOpen, {
        from: { opacity: 0, y: -10 },
        enter: { opacity: 1, y: 0 },
        leave: { opacity: 0, y: 10 },
        config: config.wobbly,
    })
    const messages = [
        ...chats,
        ...(getSortedChunks?.split('\n**')?.map((el: string) => ({ message: el, role: 'Assistant' })) ?? ([] as any)),
    ]
    const activeTransactions = useAppSelector((state) => state.transactions.activeTransactions)
    const useConversation = useConversationHook({})
    return (
        <Dialog.Root open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <Dialog.Portal>
                {transitions((styles, item: any) =>
                    item ? (
                        <>
                            <Dialog.Overlay className="bg-black/95 fixed inset-0 z-9999">
                                <animated.div
                                    className="relative dark:bg-gray-800 justify-center w-full max-w-3xl rounded-lg shadow-3xl overflow-hidden"
                                    style={{
                                        opacity: styles.opacity,
                                    }}
                                />
                            </Dialog.Overlay>
                            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-9999">
                                <animated.div
                                    className={`relative dark:bg-gray-800 w-full justify-center rounded-lg shadow-3xl overflow-hidden flex flex-row ${
                                        activeTransactions ? '' : 'max-w-3xl'
                                    }`}
                                    style={styles}
                                >
                                    {activeTransactions?.length && (
                                        <div
                                            style={{ minWidth: 400 }}
                                            className="flex flex-col hide-scrollbar overflow-auto h-[65vh] w-[20vw] p-4 bg-black rounded-lg text-white"
                                        >
                                            <p className="text-bold text-lg mb-2">Current Transactions</p>
                                            <div className="grid grid-cols-3 gap-4 border-b pb-2 font-semibold text-gray-700">
                                                <div>Transaction</div>
                                                <div>Amount</div>
                                                <div>Date</div>
                                            </div>
                                            <div className="divide-y">
                                                {activeTransactions.map((transaction, index) => (
                                                    <div
                                                        key={index}
                                                        className="grid grid-cols-3 gap-4 py-2 text-gray-600 text-sm"
                                                    >
                                                        <div>{transaction.name}</div>
                                                        <div>
                                                            <Currency
                                                                amount={transaction.amount}
                                                                currency={transaction.iso_currency_code}
                                                            />
                                                        </div>
                                                        <div>{transaction.date}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="relative dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-3xl overflow-hidden hide-scrollbar">
                                        <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 hide-scrollbar border-b border-gray-300 dark:border-gray-700">
                                            <Dialog.Close onClick={() => setIsSidebarOpen(false)} asChild>
                                                <button className="text-red-500 hover:text-red-700 text-4xl">
                                                    <X size={36} />
                                                </button>
                                            </Dialog.Close>
                                        </div>

                                        <AgentConversation
                                            accounts={ids ?? []}
                                            messages={useConversation.messages}
                                            sendMessage={useConversation.sendMessage}
                                            model={'sonnet'}
                                            setModel={function (model: ModelOption): void {
                                                throw new Error('Function not implemented.')
                                            }}
                                            loadingState={LoadingStates.NotLoading}
                                            setLoadingState={useConversation.setLoadingState}
                                        />
                                    </div>
                                </animated.div>
                            </Dialog.Content>
                        </>
                    ) : null
                )}
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default Chatbar

const QuestionBubbles = ({
    category,
    handleChatSubmit,
    chatFocus,
    disabled,
}: {
    category: HighLevelTransactionCategory
    handleChatSubmit: (val: string, focus: ChatFocus) => void
    chatFocus: ChatFocus
    disabled: boolean
}) => {
    return (
        <div className="flex flex-wrap gap-2 p-4">
            {demoQuestions[category].map((question, index) => (
                <button
                    disabled={disabled}
                    key={index}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
                    onClick={() => handleChatSubmit(question, chatFocus)}
                >
                    {question}
                </button>
            ))}
        </div>
    )
}

const demoQuestions: Record<HighLevelTransactionCategory, string[]> = {
    [HighLevelTransactionCategory.INCOME_DIVIDENDS]: [
        'Where did this income come from?',
        'How can I increase my income?',
    ],
    [HighLevelTransactionCategory.INCOME_INTEREST_EARNED]: [
        'Where did this income come from?',
        'How can I increase my income?',
    ],
    [HighLevelTransactionCategory.INCOME_OTHER_INCOME]: [
        'Where did this income come from?',
        'How can I increase my income?',
    ],
    [HighLevelTransactionCategory.INCOME_TAX_REFUND]: [
        'Where did this income come from?',
        'How can I increase my income?',
    ],
    [HighLevelTransactionCategory.INCOME_UNEMPLOYMENT]: [
        'Where did this income come from?',
        'How can I increase my income?',
    ],
    [HighLevelTransactionCategory.INCOME_WAGES]: ['Where did this income come from?', 'How can I increase my income?'],
    [HighLevelTransactionCategory.TRANSFER_IN_ACCOUNT_TRANSFER]: [
        'Why did I receive this transfer?',
        'Is this a recurring transfer?',
    ],

    [HighLevelTransactionCategory.TRANSFER_IN_CASH_ADVANCES_AND_LOANS]: [
        'Why did I receive this transfer?',
        'Is this a recurring transfer?',
    ],
    [HighLevelTransactionCategory.TRANSFER_IN_DEPOSIT]: [
        'Why did I receive this transfer?',
        'Is this a recurring transfer?',
    ],
    [HighLevelTransactionCategory.TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS]: [
        'Why did I receive this transfer?',
        'Is this a recurring transfer?',
    ],
    [HighLevelTransactionCategory.TRANSFER_IN_OTHER_TRANSFER_IN]: [
        'Why did I receive this transfer?',
        'Is this a recurring transfer?',
    ],
    [HighLevelTransactionCategory.TRANSFER_IN_SAVINGS]: [
        'Why did I receive this transfer?',
        'Is this a recurring transfer?',
    ],
    [HighLevelTransactionCategory.TRANSFER_OUT_ACCOUNT_TRANSFER]: [
        'Why did I make this transfer?',
        'How can I reduce transfers out?',
    ],
    [HighLevelTransactionCategory.TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS]: [
        'Why did I make this transfer?',
        'How can I reduce transfers out?',
    ],
    [HighLevelTransactionCategory.TRANSFER_OUT_OTHER_TRANSFER_OUT]: [
        'Why did I make this transfer?',
        'How can I reduce transfers out?',
    ],
    [HighLevelTransactionCategory.TRANSFER_OUT_SAVINGS]: [
        'Why did I make this transfer?',
        'How can I reduce transfers out?',
    ],
    [HighLevelTransactionCategory.TRANSFER_OUT_WITHDRAWAL]: [
        'Why did I make this transfer?',
        'How can I reduce transfers out?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS]: ['What loan was this payment for?', 'How much interest am I paying?'],
    [HighLevelTransactionCategory.BANK_FEES]: ['Why did I incur bank fees?', 'How can I avoid bank fees?'],
    [HighLevelTransactionCategory.ENTERTAINMENT]: [
        'What did I spend on entertainment?',
        'How can I limit these entertainment expenses?',
    ],
    [HighLevelTransactionCategory.FOOD_AND_DRINK]: [
        'How much am I spending on food and drinks?',
        'Can I save on dining expenses?',
    ],
    [HighLevelTransactionCategory.GENERAL_MERCHANDISE]: [
        'What did I buy recently?',
        'Is there a way to save on merchandise?',
    ],
    [HighLevelTransactionCategory.HOME_IMPROVEMENT]: [
        'What home improvements were made?',
        'Can I reduce home improvement costs?',
    ],
    [HighLevelTransactionCategory.MEDICAL]: [
        'What medical expenses did I incur?',
        'Are there ways to reduce medical costs?',
    ],
    [HighLevelTransactionCategory.PERSONAL_CARE]: [
        'What are my personal care expenses?',
        'Can I save on personal care?',
    ],
    [HighLevelTransactionCategory.GENERAL_SERVICES]: [
        'What services did I pay for?',
        'Are there any cheaper alternatives?',
    ],
    [HighLevelTransactionCategory.GOVERNMENT_AND_NON_PROFIT]: [
        'What donations or government fees did I pay?',
        'Is there a tax deduction available?',
    ],
    [HighLevelTransactionCategory.TRANSPORTATION]: [
        'How much did I spend on transportation?',
        'Can I reduce transportation costs?',
    ],
    [HighLevelTransactionCategory.TRAVEL]: ['What travel expenses did I incur?', 'How can I save on future travel?'],
    [HighLevelTransactionCategory.INCOME_RETIREMENT_PENSION]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS_CAR_PAYMENT]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS_CREDIT_CARD_PAYMENT]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS_MORTGAGE_PAYMENT]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.LOAN_PAYMENTS_OTHER_PAYMENT]: [
        'What loan was this payment for?',
        'How much interest am I paying?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_GAS_AND_ELECTRICITY]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_INTERNET_AND_CABLE]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_RENT]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_TELEPHONE]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_WATER]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES_OTHER_UTILITIES]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
    [HighLevelTransactionCategory.INCOME]: [],
    [HighLevelTransactionCategory.TRANSFER_IN]: [],
    [HighLevelTransactionCategory.TRANSFER_OUT]: [],
    [HighLevelTransactionCategory.RENT_AND_UTILITIES]: [],
}
