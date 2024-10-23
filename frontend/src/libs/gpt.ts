import OpenAI from 'openai'
import { AssistantToolChoice } from 'openai/resources/beta/threads/threads.mjs'
import { getFinancialRecommendations } from '../graphql/queries'
import { ChatFocus, GetFinancialRecommendationsQuery, Recommendation } from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'

export interface Transfer {
    fromAccountName: string
    toAccountName: string
    amount: string
}

export const apiClient = new OpenAI({
    apiKey: ''!,
    dangerouslyAllowBrowser: true,
})

const chat = apiClient.chat

export const getFinancialRecommendationsFromData = async (
    prompt: string,
    client: { graphql: GraphQLMethod }
): Promise<Recommendation[]> => {
    const res = await client.graphql({
        query: getFinancialRecommendations,
        variables: { chat: { prompt: prompt, chatFocus: ChatFocus.All } },
    })
    const data: GetFinancialRecommendationsQuery = res.data!
    const recommendations = data.getFinancialRecommendations!
    return recommendations as Recommendation[]
}

export const completeChatFromPrompt = async (prompt: string) => {
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'system',
                content:
                    'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions.',
            },
            {
                role: 'user',
                content: prompt.substring(0, 20000),
            },
        ],
        model: 'gpt-4o',
    })
    return chatOutput.choices[0].message!
}

const flatten = (value: any): any[] => {
    // If the value is an array, flatten each element recursively
    if (Array.isArray(value)) {
        return value.flatMap(flatten) // Use flatMap to flatten the array recursively
    }
    // If the value is an object, flatten its values recursively
    if (typeof value === 'object' && value !== null) {
        return flatten(Object.values(value))
    }
    // If the value is neither an array nor an object, return it as a single-element array
    return [value]
}

export const getTechnicalWordsWhereWeCanGoDeeper = async (prompt: string): Promise<string[]> => {
    try {
        const chatOutput = await chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'We are summarizing financial information return the exact phrases (include special characters and punctuation) where we could do financial analysis into the topic.  respond in the json format [phrase1, phrase2]]',
                },
                {
                    role: 'user',
                    content: prompt.substring(0, 20000),
                },
            ],
            response_format: { type: 'json_object' },
            model: 'gpt-3.5-turbo',
        })
        const jsonObject = JSON.parse(chatOutput.choices[0].message!.content || '')
        if (jsonObject.phrase1 || jsonObject.phrases || Object.keys(jsonObject).length > 0) {
            return flatten(Object.values(jsonObject))
        } else if (jsonObject.length) {
            return flatten(jsonObject)
        } else {
            return []
        }
    } catch (e) {
        return []
    }
}

export const createAssistant = async () =>
    apiClient.beta.assistants.create({
        instructions:
            'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. write and run code to answer the question.',
        model: 'gpt-4o-mini',
        tools: [{ type: 'code_interpreter' }],
    })

export const uploadFileToAssistant = async (file: File) => {
    // Upload a file with an "assistants" purpose
    const fileReturn = await apiClient.files.create({
        file: file,
        purpose: 'assistants',
    })
    return fileReturn
}

export const codeInterperterForAnalysis = async (fileIds: string[], assistant_id: string, prompt: string) => {
    const thread = await apiClient.beta.threads.create({
        messages: [
            {
                role: 'user',
                content: prompt,
                attachments: fileIds.map((fileId) => ({ file_id: fileId, tools: [{ type: 'code_interpreter' }] })),
            },
        ],
    })
    return thread
}

export const runThread = async (threadId: string, assistant_id: string) => {
    const runParams = {
        assistant_id: assistant_id,
        tool_choice: { type: 'code_interpreter' } as AssistantToolChoice,
    }
    const status = await apiClient.beta.threads.runs.createAndPoll(threadId, runParams)
    // Upload a file with an "assistants" purpose
    console.log(status)
    return status
}

export const listMessagesForThread = async (threadId: string) => {
    const messages = await apiClient.beta.threads.messages.list(threadId)
    // Upload a file with an "assistants" purpose
    console.log(messages)
    return messages
}
