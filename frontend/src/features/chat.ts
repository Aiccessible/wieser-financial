import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { getFinancialConversationResponse } from '../graphql/queries'
import { ChatFocus, GetFinancialConversationResponseQuery } from '../API'
// Define a type for the slice state
interface ChatState {
    chats: string[]
    error: string | undefined
    loadingChat: boolean
}

// Define the initial state using that type
const initialState: ChatState = {
    chats: [],
    error: undefined,
    loadingChat: false,
}

export const sendChatToLLM = createAsyncThunk<
    any,
    { newChat: string; client: any; focus: ChatFocus },
    { state: RootState }
>('chat/chat-llm', async (input: { newChat: string; client: any; focus: ChatFocus }, getThunkApi) => {
    try {
        const res = await input.client.graphql({
            query: getFinancialConversationResponse,
            variables: {
                prompt:
                    input.newChat +
                    '\n Accounts:' +
                    JSON.stringify((getThunkApi.getState() as any).accounts.accounts) +
                    ' Investments: ' +
                    JSON.stringify(getThunkApi.getState().investments.investments) +
                    ' Transactions: ' +
                    JSON.stringify(getThunkApi.getState().transactions.transactions),
                focus: input.focus,
            },
        })
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, chatResponse: res, loading: false }
        }
        const data: GetFinancialConversationResponseQuery = res.data
        return {
            chatResponse: data.getFinancialConversationResponse.response,
            loading: false,
        }
    } catch (e: any) {
        return { error: e?.message }
    }
})

export const chatSlice = createSlice({
    name: 'chat',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setChatError: (state, action) => {
            state.error = action.payload
        },
    },
    extraReducers(builder) {
        builder.addCase(sendChatToLLM.fulfilled, (state, action) => {
            action.payload.chatResponse && state.chats.push(action.payload.chatResponse)
            state.loadingChat = false
            state.error = action.payload.error
        })
        builder.addCase(sendChatToLLM.rejected, (state, action) => {
            state.error = 'Failed to get recommendations because ' + action.error.message
            state.loadingChat = false
        })
        builder.addCase(sendChatToLLM.pending, (state, action) => {
            state.chats.push(action.meta.arg?.newChat)
            state.error = undefined
            state.loadingChat = true
        })
    },
})

export const { setChatError } = chatSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default chatSlice.reducer