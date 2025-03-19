import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { getFinancialConversationResponse } from '../graphql/queries'
import {
    ChatFocus,
    GetFinancialConversationResponseQuery,
    HighLevelTransactionCategory,
    Role,
    SpendingSummary,
} from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { FinancialProjection } from '../components/hooks/useDefaultValuesForProjection'
import { financialProjectionToChatInput } from './analysis'
import { useAPI } from '../hooks/useApi'

// Define a type for the slice state
interface ChatState {
    chats: { role: string; message: string; date: string | number }[]
    error: string | undefined
    loadingChat: boolean
    currentScope: ChatFocus | undefined
    currentDateRange: [number?, number?] | undefined
    highLevelSpendingCategory: HighLevelTransactionCategory | undefined
    newChat: string
    chatOpen: boolean
}
const firstOfMonth = new Date()
firstOfMonth.setDate(1)
firstOfMonth.setHours(0, 0, 0, 0) // Clear time to start at midnight for consistency

// Define the initial state using that type
const initialState: ChatState = {
    chats: [],
    error: undefined,
    loadingChat: false,
    currentScope: undefined,
    currentDateRange: [firstOfMonth.getTime(), Date.now()],
    highLevelSpendingCategory: undefined,
    newChat: '',
    chatOpen: false,
}

export interface SendChatToLLMArgs {
    newChat: string
    client: { graphql: GraphQLMethod }
    focus: ChatFocus
    ids: string[]
    dontRagFetch?: boolean
    currentDateRange?: [number?, number?]
    highLevelSpendingCategory?: HighLevelTransactionCategory | undefined
    projection: FinancialProjection
}

export const sendChatToLLM = createAsyncThunk<any, SendChatToLLMArgs, { state: RootState }>(
    'chat/chat-llm',
    async (input: SendChatToLLMArgs, getThunkApi) => {
        const api = useAPI()

        const ids =
            getThunkApi
                .getState()
                .idsSlice.institutions?.map((account) => account.item_id)
                .slice(0, 25) ?? []
        const currentChats =
            getThunkApi
                .getState()
                .chat.chats?.map((chat) => ({
                    role: chat.role === 'user' ? Role.user : Role.assistant,
                    message: chat.message ?? '',
                }))
                .slice(0, 5) ?? []
        try {
            if (input.focus === ChatFocus.All) {
                input.newChat =
                    input.newChat +
                    `. Here is some context and I will provide more detailed info below ${financialProjectionToChatInput(
                        input.projection
                    )}`
            }
            console.info('sending ', input)
            const res = await api.apiFetch(process.env.LLM_API + '/finance/agents/message', {
                body: JSON.stringify({
                    accounts: ids,
                    message: input.newChat,
                    model: 'o3-mini',
                    chatFocus: input.focus,
                    currentDateRange: input.currentDateRange?.map((el) => (el ? el.toString() : null)),
                    highLevelCategory: input.highLevelSpendingCategory,
                }),
            })
            const chatResponse = await res.json()
            return { chatResponse: chatResponse, loading: false }
        } catch (e: any) {
            console.error(e)
            return { error: e?.message }
        }
    }
)

export const chatSlice = createSlice({
    name: 'chat',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setChatError: (state, action) => {
            state.error = action.payload
        },
        setChatParams: (state, action) => {
            state.currentDateRange = action.payload.dateRange
            state.currentScope = action.payload.scope
            state.highLevelSpendingCategory = action.payload.highLevelTransactionCategory
            state.chatOpen = true
        },
        updateDateRange: (state, action) => {
            state.currentDateRange = action.payload
        },
        setLoadingChat: (state, action) => {
            state.loadingChat = action.payload
        },
        setNewChatVal: (state, action) => {
            state.newChat = action.payload
        },
        setIsChatOpen: (state, action) => {
            state.chatOpen = action.payload
        },
        pushChatToLLM: (state, action) => {
            state.chats.push({ role: 'Assistant', message: action.payload, date: Date.now() })
        },
    },
    extraReducers(builder) {
        builder.addCase(sendChatToLLM.fulfilled, (state, action) => {
            action.payload.chatResponse &&
                state.chats.push({ role: 'Assistant', message: action.payload.chatResponse, date: Date.now() })
            state.error = action.payload.error
        })
        builder.addCase(sendChatToLLM.rejected, (state, action) => {
            state.error = 'Failed to get recommendations because ' + action.error.message
            state.loadingChat = false
        })
        builder.addCase(sendChatToLLM.pending, (state, action) => {
            state.chats.push({ role: 'User', message: action.meta.arg?.newChat, date: Date.now() })
            state.error = undefined
            state.loadingChat = true
            state.newChat = ''
        })
    },
})

export const {
    setChatError,
    setChatParams,
    updateDateRange,
    setLoadingChat,
    setNewChatVal,
    setIsChatOpen,
    pushChatToLLM,
} = chatSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default chatSlice.reducer
