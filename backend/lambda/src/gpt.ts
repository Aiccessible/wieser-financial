import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { AssistantToolChoice } from 'openai/resources/beta/threads/threads'
import { stat } from 'fs'
import { ChatFocus } from './API'

const recommendationAction = z.object({
    description: z.string(),
    transfers: z.array(
        z.object({
            amount: z.string(),
            fromAccountName: z.string(),
            toAccountName: z.string(),
        })
    ),
})

const Recommendations = z.object({
    recommendations: z.array(
        z.object({
            explanation: z.string(),
            action: recommendationAction,
            title: z.string(),
            priority: z.enum(['High', 'Medium', 'Low']),
        })
    ),
})
export interface Transfer {
    fromAccountName: string
    toAccountName: string
    amount: string
}
interface RecommendationAction {
    transfers: Transfer[]
    description: string
}

export interface Recommendation {
    explanation: string
    action: RecommendationAction
    title: string
    priority: number
}

export const apiClient = new OpenAI({
    apiKey: process.env['GptSecretKey']!,
    dangerouslyAllowBrowser: false,
})

const chat = apiClient.chat

export const getFinancialRecommendationsFromData = async (prompt: string) => {
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'system',
                content:
                    'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. Leave the transfer information empty if no transfer is needed',
            },
            {
                role: 'user',
                content: prompt.substring(0, 20000),
            },
        ],
        model: 'gpt-4o',
        response_format: zodResponseFormat(Recommendations, 'recommendations'),
    })
    return chatOutput.choices[0].message!
}

export const completeChatFromPrompt = async (prompt: string, type: ChatFocus | null | undefined) => {
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a personal ${
                    type && type !== ChatFocus.All ? type : 'Finance'
                } assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions.`,
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
