import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader, MessageCircleIcon } from 'lucide-react'
import { cn } from '../../libs/utlis'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { Alert } from '@aws-amplify/ui-react'
import { sendChatToLLM } from '../../features/chat'
import { generateClient } from 'aws-amplify/api'
import { Chat, ChatFocus, ChatResponse } from '../../API'
import { CustomTextBox } from '../common/CustomTextBox'
import { useDataLoading } from '../../hooks/useDataLoading'
import { onCreateChat } from '../../graphql/subscriptions'
import { fetchAuthSession } from 'aws-amplify/auth'
import Markdown from 'react-markdown'

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
    const chats = useAppSelector((state) => state.chat.chats)
    const isChatLoading = useAppSelector((state) => state.chat.loadingChat)
    const error = useAppSelector((state) => state.chat.error)
    const client = generateClient()
    const [chunks, setChunks] = useState<Record<string, Chat[]>>()
    const [completedChats, setCompletedChats] = useState<any[]>([])

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

    const typingSpeed = 200
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

        dispatch(
            sendChatToLLM({
                newChat: inputValue,
                client,
                focus,
                id,
            })
        )
        setInputValue('') // Clear input after submission
        setWordIndex(0)
    }
    const renderPremiumChat = (chat: any) => {
        const splitResponse = chat?.response?.split(' ')
        const length = wordIndex > splitResponse?.length ? splitResponse?.length : wordIndex
        return (
            <div>
                {chat && (
                    <CustomTextBox>
                        <Markdown>{splitResponse?.slice(0, length ?? 0).join(' ')}</Markdown>
                    </CustomTextBox>
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
    console.log(getChunksAsValidJson)

    return (
        <aside
            className={cn(
                `absolute right-0 top-0 z-9999 flex h-screen w-5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0`,
                {
                    'w-70': isSidebarOpen,
                }
            )}
        >
            {/* Header */}
            <div className="relative flex w-full items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                <Link className="flex items-center" to="/">
                    {isSidebarOpen && <h1 className="ml-2 text-xl font-semibold text-white">Chat</h1>}
                </Link>
                {isSidebarOpen && (
                    <MessageCircleIcon
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="h-6 w-6 text-white cursor-pointer"
                    />
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
            {isChatLoading && (
                <div className="absolute bottom-20 w-full flex justify-center">
                    <Loader className="animate-spin text-white" />
                </div>
            )}
        </aside>
    )
}

export default Chatbar
