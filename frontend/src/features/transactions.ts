import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getTransactions } from '../graphql/queries'
import { Transaction } from '../API'
// Define a type for the slice state
interface AccountsState {
    acccountRecommendation: string
    transactions: Transaction[] | undefined
    cursor: string | undefined
    loading: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: AccountsState = {
    acccountRecommendation: '',
    error: undefined,
    loading: false,
    transactions: undefined,
    cursor: undefined,
}

export interface GetTransactionInput {
    client: any
    id: string
    append: boolean
}

export interface GetTransactionRecommendation {
    id: string
}

export const getTransactionsAsync = createAsyncThunk(
    'transaction/get-transactions',
    async (input: GetTransactionInput, getThunk: any) => {
        const res = await input.client.graphql({
            query: getTransactions,
            variables: { id: input.id, cursor: (getThunk.getState() as any).transactions.cursor },
        })
        console.log(res)
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, accounts: res.data.getTransactions }
        }
        return {
            transactions: input.append
                ? [...(getThunk.getState() as any).transactions.transactions, ...res.data.getTransactions.transactions]
                : res.data.getTransactions.transactions,
            cursor: res.data.getTransactions.cursor,
            loading: false,
        }
    }
)

export const investmentSlice = createSlice({
    name: 'investment',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getTransactionsAsync.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors : undefined
            state.transactions = action.payload.transactions ?? []
            state.cursor = action.payload.cursor
            state.loading = false
        })
        builder.addCase(getTransactionsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.transactions = (action.payload as any)?.transactions ?? []
            state.loading = false
        })
        builder.addCase(getTransactionsAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
    },
})

export const { removeError } = investmentSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default investmentSlice.reducer
