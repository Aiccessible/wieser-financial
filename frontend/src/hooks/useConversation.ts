'use client'

import { useEffect, useState } from 'react'
import { Lexer } from '../libs/Lexer'
import { useAPI } from './useApi'
export type ToolCall = {
    name: string
    args: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsedArgs?: Record<string, any>
    id: string
    index: number
}

const getLLMApiUrl = () => process.env.REACT_APP_LLM_URL

export type Message = {
    content: string
    id: string
    timestamp: number
    conversationId: string
    role: string
    tool_calls?: ToolCall[]
}

export type Conversation = {
    id: string
    projectId: string
    title: string
    timestamp: number
    userId: string
}
export enum LoadingStates {
    NotLoading,
    WaitingForCompletion,
    RefreshingFiles,
}

export interface SendMessageResult {
    error?: string
    success: boolean
}

export type SendMessageFunctionType = (
    message: string,
    accounts: string[],
    onSend: (result: SendMessageResult) => void
) => Promise<{ updatedFiles: string[] } | undefined>
export type useConversationHookProps = {}

export default function useConversationHook({}: useConversationHookProps) {
    const { apiFetch } = useAPI()

    const [conversationId, setConversationId] = useState<string | null>(null)
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])

    const [loadingState, setLoadingState] = useState<LoadingStates>(LoadingStates.NotLoading)

    const getLatestConversation = async () => {
        const response = await apiFetch(getLLMApiUrl() + `/conversations/latest`)
        if (response.ok) {
            const respJson = await response.json()

            // filter out tool messages
            const filteredMessages = respJson.messages.filter((message: Message) => message.role !== 'tool')

            setConversation(respJson.conversation)
            setMessages(filteredMessages)
            setConversationId(respJson.conversation.id)
        }
    }

    // check if conversation Id exists in local storage
    useEffect(() => {
        getLatestConversation()
    }, [])

    useEffect(() => {
        setConversationId(null)
        setConversation(null)
        setMessages([])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getConversation = async (conversationId: string) => {
        const response = await apiFetch(getLLMApiUrl() + '/conversations/' + conversationId)
        if (response.ok) {
            const respJson = await response.json()
            setConversation(respJson.conversation)
            setMessages(respJson.messages)
        }
    }

    const sendMessage = async (message: string, accounts: string[], onSend: (result: SendMessageResult) => void) => {
        let currentConvo = conversationId

        // add message to conversation
        const newMessages = [
            ...messages,
            {
                id: crypto.randomUUID(),
                conversationId: currentConvo!,
                role: 'user',
                content: message,
                timestamp: Date.now(),
            },
        ]

        const response = await apiFetch(getLLMApiUrl() + '/llms/finance/agents/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accounts: accounts!,
                message,
                model: 'o3-mini',
            }),
        })
        if (!response.ok) {
            const errMessage = await response.text()
            onSend({ success: false, error: errMessage })
            return
        }
        setMessages(newMessages)

        // response returns sse stream
        const reader = response.body?.getReader()
        if (!reader) {
            onSend({ success: false, error: 'Failed to get stream' })
            return
        }

        const messagesReceived = []
        let currentMessage

        let shouldUpdateServerJS = false
        let shouldGetNewFiles = false

        let done, value
        const updatedFiles = []
        onSend({ success: true, error: undefined })
        while (!done) {
            ;({ done, value } = await reader.read())

            // decode the stream
            const chunk = new TextDecoder().decode(value)

            // one chunk may have multiple event, data pairs
            try {
                const events = chunk.split('\n\n')
                for (const event of events) {
                    const lines = event.split('\n')

                    if (lines.length < 2) continue

                    let type = lines[0]
                    type = type.replace('event: ', '')

                    const data = lines[1].replace('data: ', '')
                    const dataJSON = JSON.parse(data)
                    if (type === 'message') {
                        // if ids do not match, create new message
                        if (currentMessage?.id !== dataJSON.id) {
                            currentMessage = dataJSON
                            // if role is tool, do not add to messages
                            if (currentMessage.role === 'tool') continue
                            messagesReceived.push(currentMessage)
                            // parse tool calls
                            if (currentMessage.tool_calls) {
                                for (const toolCall of currentMessage.tool_calls) {
                                    if (toolCall.name && toolCall.name.includes('route')) {
                                        updatedFiles.push('server.js')
                                        shouldUpdateServerJS = true
                                    }

                                    if (toolCall.name && toolCall.name === 'add_html_page') {
                                        updatedFiles.push(toolCall.parsedArgs.name)
                                        shouldGetNewFiles = true
                                    }

                                    // try to parse args
                                    try {
                                        const args = JSON.parse(toolCall.args)
                                        toolCall.parsedArgs = args
                                    } catch {
                                        try {
                                            const lexer = new Lexer()
                                            console.log(toolCall.args)
                                            lexer.AppendString(toolCall.args)
                                            const args = JSON.parse(lexer.CompleteJSON())
                                            toolCall.parsedArgs = args
                                            console.log('COMPLETED JSON', args)
                                        } catch {}
                                    }

                                    // if tool is edit_html_page, send file update
                                }
                            }
                        } else {
                            // if ids match, append content to current message
                            currentMessage.content += dataJSON.content
                            if (dataJSON.timestamp) {
                                currentMessage.timestamp = dataJSON.timestamp
                            }

                            if (dataJSON.tool_calls) {
                                // merge in new tool calls
                                for (const toolCallChunk of dataJSON.tool_calls) {
                                    if (toolCallChunk.id) {
                                        currentMessage.tool_calls.push({
                                            id: toolCallChunk.id,
                                            name: toolCallChunk.name,
                                            args: toolCallChunk.args,
                                        })

                                        if (toolCallChunk.name.includes('route')) {
                                            updatedFiles.push('server.js')
                                            shouldUpdateServerJS = true
                                        }
                                    }

                                    const toolCall = currentMessage.tool_calls[toolCallChunk.index as number]

                                    if (toolCall) {
                                        toolCall.args += toolCallChunk.args

                                        // try to parse args
                                        try {
                                            const args = JSON.parse(toolCall.args)
                                            toolCall.parsedArgs = args
                                        } catch {
                                            try {
                                                const lexer = new Lexer()
                                                console.log(toolCall.args)
                                                lexer.AppendString(toolCall.args)
                                                const args = JSON.parse(lexer.CompleteJSON())
                                                toolCall.parsedArgs = args
                                                console.log('COMPLETED JSON', args)
                                            } catch {}
                                        }

                                        // if tool is edit_html_page, send file update
                                        if (toolCall.name === 'edit_html_page' && toolCall.parsedArgs) {
                                            updatedFiles.push(toolCall.parsedArgs.name)
                                        }
                                    }
                                }
                            }
                        }

                        // update messages
                        setMessages([...newMessages, ...messagesReceived])
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }

        console.info('trigger refresh')
        return { updatedFiles }
    }

    return {
        conversationId,
        conversation,
        messages,
        sendMessage,
        loadingState,
        setLoadingState,
    }
}
