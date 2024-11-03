import { GetThunkAPI, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAccounts, getItems } from '../graphql/queries'
import { Account, Item } from '../API'
import { completeChatFromPrompt } from '../libs/gpt'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
// Define a type for the slice state
interface ItemsState {
    institutions: Item[] | undefined
    loading: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: ItemsState = {
    institutions: undefined,
    error: undefined,
    loading: false,
}

export interface GetIdsInput {
    client: { graphql: GraphQLMethod }
}

export interface GetAccountRecommendation {
    id: string
}

export const getIdsAsync = createAsyncThunk('items/get-ids', async (input: GetIdsInput) => {
    const res = await input.client.graphql({
        query: getItems,
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, ids: res.data.getItems }
    }
    return { ids: res.data.getItems }
})

export const idsSlice = createSlice({
    name: 'items',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getIdsAsync.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.institutions = action.payload.ids.items ?? []
            state.loading = false
        })
        builder.addCase(getIdsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.institutions = (action.payload as any)?.ids.items ?? []
            state.loading = false
        })
        builder.addCase(getIdsAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
    },
})

export const { removeError } = idsSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default idsSlice.reducer
