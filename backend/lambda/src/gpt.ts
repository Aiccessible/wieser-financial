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
    console.log('Sending', prompt, ' to gpt')
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

export enum InformationOptions {
    'INVESTMENTS',
    'TRANSACTIONS',
    'BANKACCOUNTS',
}
export interface GptDateResponse {
    day: number
    month: number
    year: number
}
export interface DataRangeResponse {
    startDay: GptDateResponse
    endDay: GptDateResponse
    hasNoTimeConstraint: boolean
}

export interface InformationOptionsResponse {
    optionsForInformation: InformationOptions[]
}

function getFormattedCurrentDate(): string {
    const now = new Date() // Get the current date and time

    // Extract year, month, and day
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0') // Months are 0-based, so add 1
    const day = String(now.getDate()).padStart(2, '0')

    // Return the formatted date as 'YYYY-MM-DD'
    return `${year}-${month}-${day}`
}

export const getDateRangeFromModel = async (prompt: string) => {
    const AcceptableValuesForDateRange = z.object({
        startDay: z.object({
            day: z.number(),
            month: z.number(),
            year: z.number(),
        }),
        endDay: z.object({
            day: z.number(),
            month: z.number(),
            year: z.number(),
        }),
        hasNoTimeConstraint: z.boolean(),
    })
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'user',
                content:
                    'The current date is ' +
                    getFormattedCurrentDate() +
                    ' Fill out the best suited date range for the following query: ' +
                    prompt.substring(0, 100),
            },
        ],
        model: 'gpt-4o-mini',
        response_format: zodResponseFormat(AcceptableValuesForDateRange, 'dateRange'),
    })
    return chatOutput.choices[0].message!
}

export const getNeededInformationFromModel = async (prompt: string) => {
    console.log('Getting needed information')
    const AcceptableInformationOptions = z.object({
        optionsForInformation: z.array(z.enum(['INVESTMENTS', 'TRANSACTIONS', 'BANKACCOUNTS'])),
    })
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'user',
                content: 'What information is best suited to answer the following query: ' + prompt.substring(0, 100),
            },
        ],
        model: 'gpt-4o-mini',
        response_format: zodResponseFormat(AcceptableInformationOptions, 'dateRange'),
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
