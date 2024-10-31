import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircleIcon } from 'lucide-react'
import Loader from '../../components/common/Loader'
import { cn } from '../../libs/utlis'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { Alert, Heading } from '@aws-amplify/ui-react'
import chat, { sendChatToLLM, setChatParams, setLoadingChat } from '../../features/chat'
import { generateClient } from 'aws-amplify/api'
import { Chat, ChatFocus, ChatResponse, HighLevelTransactionCategory } from '../../API'
import { onCreateChat } from '../../graphql/subscriptions'
import { fetchAuthSession } from 'aws-amplify/auth'
import Markdown from 'react-markdown'
import { CustomTextBox } from '../common/CustomTextBox'

export async function custom_headers() {
    const accessToken = (await fetchAuthSession()).tokens?.accessToken?.toString()
    return { Authorization: `Bearer ${accessToken}` }
}
interface SidebarProps {
    isSidebarOpen: boolean
    setIsSidebarOpen: (arg: boolean) => void
    id: string
}

const Chatbar = ({ isSidebarOpen, setIsSidebarOpen, id }: SidebarProps) => {
    const dispatch = useAppDispatch()
    const isChatLoading = useAppSelector((state) => state.chat.loadingChat)
    const error = useAppSelector((state) => state.chat.error)
    const chatFocus = useAppSelector((state) => state.chat.currentScope)
    const highLevelCategory = useAppSelector((state) => state.chat.highLevelSpendingCategory)
    const currentDateRange = useAppSelector((state) => state.chat.currentDateRange)
    const client = generateClient()
    const [chunks, setChunks] = useState<Record<string, Chat[]>>()
    const [completedChats, setCompletedChats] = useState<any[]>([])
    useEffect(() => {
        chatFocus && setIsSidebarOpen(true)
    }, [chatFocus])
    const getActiveChunkIds = useMemo(() => {
        const keys = Object.keys(chunks || {})
        const activeKeys: string[] = []
        keys.forEach((key) => {
            if (completedChats?.find((chat) => chat.messageId === key)) {
                activeKeys.push(key)
            }
        })
        return activeKeys
    }, [completedChats, chunks, setChunks])

    const getSortedChunks = useMemo(() => {
        const mostRecentMessage = Object.keys(chunks || {})
        const mostRecentKey = mostRecentMessage
            .filter((x) => !getActiveChunkIds.find((y) => y === x))
            .sort((a, b) => parseInt(b.split('#')[1]) - parseInt(a.split('#')[1]))[0]
        const chunksOfConcern = chunks?.[mostRecentKey] ?? []
        chunksOfConcern?.sort((a, b) => (parseInt(a.sk || '') || 0) - parseInt(b.sk || ''))
        return chunksOfConcern?.map((chunks) => chunks.message).join('')
    }, [chunks, getActiveChunkIds])

    const getChunksAsValidJson = useMemo(() => {
        try {
            const chatIsDone = JSON.parse(getSortedChunks || '')
            setCompletedChats((prevValue) => [...prevValue, chatIsDone])
            return chatIsDone
        } catch {
            try {
                return JSON.parse(getSortedChunks + '"}}' || '')
            } catch {
                try {
                    return JSON.parse(getSortedChunks + '"}' || '')
                } catch {
                    return { message: 'Trying to parse' }
                }
            }
        }
    }, [getSortedChunks])
    const [wordIndex, setWordIndex] = useState(0)

    const typingSpeed = 550
    useEffect(() => {
        const intervalId = setInterval(() => {
            setWordIndex((wordIndex) => wordIndex + 1)
        }, typingSpeed)

        return () => clearInterval(intervalId) // Cleanup if component unmounts
    }, [typingSpeed])

    useEffect(() => {
        const createSub = async () => {
            console.log(await fetchAuthSession())
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
                        if (chunk.isLastChunk) {
                            setLoadingChat(false)
                        }
                        setChunks((prevChunks: Record<string, Chat[]> | undefined) => ({
                            ...(prevChunks ?? {}),
                            [chunk?.messageId ?? '']: [...(prevChunks?.[chunk?.messageId ?? ''] ?? []), chunk],
                        }))
                    },
                    error: (error) => console.warn(error),
                })
        }
        createSub()
    }, [])
    const [inputValue, setInputValue] = useState<string>('') // For handling input state

    const sendChat = (input: string, focus: ChatFocus) => {
        dispatch(
            sendChatToLLM({
                newChat: input,
                client,
                focus,
                id,
                highLevelSpendingCategory: highLevelCategory,
                currentDateRange,
            })
        )
        setInputValue('') // Clear input after submission
        setWordIndex(0)
    }
    const handleChatSubmit = (e: React.FormEvent) => {
        setChunks({})
        e.preventDefault()
        if (!inputValue.trim()) return // Prevent sending empty messages

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
    const renderPremiumChat = (chat: any) => {
        const splitResponse = chat?.response?.split(' ')
        const length = wordIndex > splitResponse?.length ? splitResponse?.length : wordIndex
        return (
            <div>
                {chat && (
                    <div className="text-white dark:text-white-300">
                        <CustomTextBox>
                            <Markdown>{splitResponse?.slice(0, length ?? 0).join(' ')}</Markdown>
                        </CustomTextBox>
                    </div>
                )}
                {
                    /**    graphs: zod_1.z.object({
        pieChart: zod_1.z.string(),
        barChart: zod_1.z.string(),
        histogram: zod_1.z.string(),
        timePlot: zod_1.z.string(),
    }), */
                    chat?.graphs?.pieChart && <span dangerouslySetInnerHTML={chat?.pieChart}></span>
                }
                {chat?.graphs?.barChart && <span dangerouslySetInnerHTML={chat?.barChart}></span>}
                {chat?.graphs?.histogram && <span dangerouslySetInnerHTML={chat?.histogram}></span>}
                {chat?.graphs?.timePlot && <span dangerouslySetInnerHTML={chat?.timePlot}></span>}
            </div>
        )
    }
    console.log(currentDateRange)
    return (
        <aside
            className={cn(
                `absolute right-0 top-0 z-997 flex h-screen w-5 flex-col overflow-y-hidden dark:bg-black dark:text-bodydark duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 shadow-lg`,
                {
                    'w-70': isSidebarOpen,
                }
            )}
        >
            {/* Header */}
            <div className="flex flex-col">
                <div className="relative flex w-full items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                    <Link className="flex items-center" to="/">
                        {isSidebarOpen && <h1 className="ml-2 text-xl font-semibold dark:text-white">Chat</h1>}
                    </Link>
                    {isSidebarOpen && (
                        <MessageCircleIcon
                            onClick={() => {
                                dispatch(setChatParams({}))
                                setIsSidebarOpen(!isSidebarOpen)
                            }}
                            className="h-6 w-6 dark:text-white cursor-pointer"
                        />
                    )}
                </div>
                {chatFocus && !isChatLoading && (
                    <Heading level={6}>
                        <CustomTextBox className="p-4">
                            Chatting about {chatFocus + 's'}{' '}
                            {currentDateRange &&
                                currentDateRange[0] &&
                                currentDateRange[1] &&
                                ` from ${new Date(currentDateRange[0]).toDateString()} to ${new Date(
                                    currentDateRange[1]
                                ).toDateString()}`}
                        </CustomTextBox>
                    </Heading>
                )}
            </div>

            {/* Error Handling */}
            {error && (
                <Alert variation="error" className="mx-4">
                    {error}
                </Alert>
            )}

            {/* Chats */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {getChunksAsValidJson && renderPremiumChat(getChunksAsValidJson)}
            </div>

            {/* Chat Input */}
            {highLevelCategory && !isChatLoading && (
                <QuestionBubbles
                    handleChatSubmit={sendChat}
                    chatFocus={chatFocus ?? ChatFocus.All}
                    category={highLevelCategory}
                />
            )}
            <form onSubmit={handleChatSubmit} className="flex items-center p-4 border-t border-gray-600 bg-gray-800">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 text-black  p-2 rounded-lg outline-none"
                />
                <button
                    type="submit"
                    className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                    Send
                </button>
            </form>

            {/* Loading Indicator */}
            {isChatLoading && wordIndex === 0 && (
                <div className="absolute bottom-20 w-full flex justify-center">
                    <Loader />
                </div>
            )}
        </aside>
    )
}

export default Chatbar

const QuestionBubbles = ({
    category,
    handleChatSubmit,
    chatFocus,
}: {
    category: HighLevelTransactionCategory
    handleChatSubmit: (val: string, focus: ChatFocus) => void
    chatFocus: ChatFocus
}) => {
    return (
        <div className="flex flex-wrap gap-2 p-4">
            {demoQuestions[category].map((question, index) => (
                <button
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
    [HighLevelTransactionCategory.INCOME]: ['Where did this income come from?', 'How can I increase my income?'],
    [HighLevelTransactionCategory.TRANSFER_IN]: ['Why did I receive this transfer?', 'Is this a recurring transfer?'],
    [HighLevelTransactionCategory.TRANSFER_OUT]: ['Why did I make this transfer?', 'How can I reduce transfers out?'],
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
    [HighLevelTransactionCategory.RENT_AND_UTILITIES]: [
        'What were my rent and utility costs?',
        'Are there ways to save on rent or utilities?',
    ],
}
