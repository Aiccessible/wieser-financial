import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { boolean } from 'zod'
import { RootState } from '../store'
import { post } from 'aws-amplify/api'
// Define a type for the slice state
interface AuthState {
    publicToken: string
    transferToken: string
    loadingTransfer: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: AuthState = {
    publicToken: '',
    transferToken: '',
    loadingTransfer: false,
    error: '',
}

interface MetadataTransferToken {
    from_institution_id: string
    from_account: string
    to_account: string
    to_institution_id: string
    amount: string
    legal_name: string
    description: string
    currency: string
    client_name: string
}
const apiName = 'plaidapi'

export const getTransferTokenAsync = createAsyncThunk<
    any,
    { metadata: MetadataTransferToken; accountId: string },
    { state: RootState }
>('auth/get-transfer-token', async (input: { metadata: MetadataTransferToken; accountId: string }, getThunkApi) => {
    try {
        const { body } = await post({
            apiName,
            path: '/v1/tokens/get_transfer_token',
            options: {
                body: {
                    account_id: input.accountId,
                    metadata: input.metadata as Record<string, any>,
                },
            },
        }).response
        const responseAsJson = (await body.json()) as any
        return { transferToken: responseAsJson['link_token'] }
    } catch (e: any) {
        return { error: e?.message }
    }
})

export const authSlice = createSlice({
    name: 'auth',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setPublicToken: (state, action) => {
            state.publicToken = action.payload
        },
        setTransferToken: (state, action) => {
            state.transferToken = action.payload
        },
        setLoadingTransfer: (state, action) => {
            state.loadingTransfer = action.payload
        },
        setAuthError: (state, action) => {
            state.error = action.payload
        },
    },
    extraReducers(builder) {
        builder.addCase(getTransferTokenAsync.fulfilled, (state, action) => {
            state.transferToken = action.payload.transferToken || ''
            state.loadingTransfer = false
            state.error = action.payload.error
        })
        builder.addCase(getTransferTokenAsync.rejected, (state, action) => {
            state.transferToken = 'Failed to get recommendations because ' + action.error.message
            state.loadingTransfer = false
        })
        builder.addCase(getTransferTokenAsync.pending, (state, action) => {
            state.error = undefined
            state.loadingTransfer = true
        })
    },
})

export const { setPublicToken, setTransferToken, setLoadingTransfer, setAuthError } = authSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default authSlice.reducer
