import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader, MessageCircleIcon } from 'lucide-react'
import { cn } from '../../libs/utlis'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { Alert } from '@aws-amplify/ui-react'
import { sendChatToLLM } from '../../features/chat'
import { generateClient } from 'aws-amplify/api'
import { ChatFocus } from '../../API'
import { CustomTextBox } from '../common/CustomTextBox'
import { useDataLoading } from '../../hooks/useDataLoading'

interface SidebarProps {
    isSidebarOpen: boolean
    setIsSidebarOpen: (arg: boolean) => void
}

const Chatbar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
    const dispatch = useAppDispatch()
    const chats = useAppSelector((state) => state.chat.chats)
    const isChatLoading = useAppSelector((state) => state.chat.loadingChat)
    const error = useAppSelector((state) => state.chat.error)
    const client = generateClient()

    const [inputValue, setInputValue] = useState<string>('') // For handling input state
    const { id } = useParams()
    const { investments, accounts, transactions } = useDataLoading({
        id: id || '',
        client,
        loadAccounts: true,
        loadInvestments: true,
        loadRecommendations: true,
        loadTransactions: true,
    })
    const handleChatSubmit = (e: React.FormEvent) => {
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
            })
        )
        setInputValue('') // Clear input after submission
    }

    return (
        <aside
            className={cn(
                `absolute right-0 top-0 z-9999 flex h-screen w-20 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0`,
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
                {chats.length ? (
                    chats.map((chat, index) => (
                        <div key={index} className="mb-2 p-2 bg-gray-700 text-white rounded-lg">
                            {chat}
                        </div>
                    ))
                ) : (
                    <CustomTextBox>No chats yet</CustomTextBox>
                )}
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
