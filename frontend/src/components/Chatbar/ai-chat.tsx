'use client'

import React from 'react'
import { cn } from '../../libs/cn' // Helper for conditional class names
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Message, SendMessageFunctionType } from '@/src/hooks/useConversation'
import { LoaderPinwheelIcon } from 'lucide-react'
import ModelSelector, { ModelOption } from '../ui/model-selector'

const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user'
    return (
        <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                <Avatar>
                    <AvatarImage className='bg-white' alt="LLM Avatar" />
                    <AvatarFallback><span className='text-white'>AI</span></AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                    'max-w-[70%] rounded-lg p-4 text-sm',
                    isUser ? 'bg-blue-500 text-white self-end' : 'bg-gray-100 text-white self-start'
                )}
            >
                <p>{message.content}</p>

                {/* tool calls */}
                {message.tool_calls && (
                    <div className="mt-2">
                        {message.tool_calls.map((toolCall) => (
                            <div key={toolCall.id} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{toolCall.name}</span>
                                <span className="text-xs text-gray-500">
                                    {toolCall.parsedArgs?.method} - {toolCall.parsedArgs?.path}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <span
                    className={cn('text-xs text-gray-500 mt-1 block', isUser ? 'text-right text-white' : 'text-left')}
                >
                    {new Date(message.timestamp).toLocaleTimeString()}
                </span>
            </div>
            {isUser && (
                <Avatar>
                    <AvatarImage alt="User Avatar" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}

type AgentConversationProps = {
    messages: Message[]
    sendMessage: SendMessageFunctionType
    model: ModelOption
    setModel: (model: ModelOption) => void
    loadingState: LoadingStates
    setLoadingState: (loadingState: LoadingStates) => void
    accounts: string[]
}

export enum LoadingStates {
    NotLoading,
    WaitingForCompletion,
    RefreshingFiles,
}
const AgentConversation: React.FC<AgentConversationProps> = ({
    messages,
    sendMessage,
    model,
    setModel,
    loadingState,
    setLoadingState,
    accounts,
}: AgentConversationProps) => {
    const [input, setInput] = React.useState('')
    const [fileName, setFileName] = React.useState('')
    const [error, setError] = React.useState('')
    const handleSend = async () => {
        if (!input.trim()) return
        setLoadingState(LoadingStates.WaitingForCompletion)
        setError('')
        const sendMessageResponse = await sendMessage(input, accounts, (result) => {
            if (result?.success) {
                console.info(result)
                setInput('')
            } else {
                console.error(result?.error)
                setError(result?.error ?? 'Unknown error')
            }
        })

        setLoadingState(LoadingStates.RefreshingFiles)

        setLoadingState(LoadingStates.NotLoading)
    }

    return (
        <div className="relative flex justify-center items-center h-[90vh] rounded-xl border shadow inset-0 bg-card text-card-foreground m-4">
            <div className="flex w-full h-[100%]">
                <div className="flex flex-col h-full p-4 w-full">
                    {/* options hamburger */}
                    {error && (
                        <span
                            style={{
                                backgroundColor: 'red',
                                borderRadius: 10,
                                padding: '1rem',
                            }}
                            className="text-red flex flex-row"
                        >
                            {error}
                        </span>
                    )}
                    {loadingState === LoadingStates.WaitingForCompletion && (
                        <span
                            style={{
                                backgroundColor: 'blue',
                                borderRadius: 10,
                                padding: '1rem',
                                justifyContent: 'space-around',
                            }}
                            className="text-white flex flex-row"
                        >
                            {'Asimov is writing code...'}
                            <LoaderPinwheelIcon />
                        </span>
                    )}
                    {loadingState === LoadingStates.RefreshingFiles && (
                        <span
                            style={{
                                backgroundColor: 'blue',
                                borderRadius: 10,
                                padding: '1rem',
                                justifyContent: 'space-around',
                            }}
                            className="text-white flex flex-row"
                        >
                            {`Asimov is refreshing ${fileName}...`}
                            <LoaderPinwheelIcon />
                        </span>
                    )}
                    <ModelSelector selectedModel={model} setSelectedModel={setModel} />
                    <div className="flex-1 p-4 border rounded-lg bg-black dark:bg-card overflow-y-auto">
                        {messages.map((message) => (
                            <ChatBubble key={message.id} message={message} />
                        ))}
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-white">Ask anything about your situation</p>
                            </div>
                        )}
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                        }}
                        className="flex items-center mt-4 gap-2"
                    >
                        <Input
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-grow text-white"
                        />
                        <Button onClick={handleSend}>Send</Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AgentConversation
