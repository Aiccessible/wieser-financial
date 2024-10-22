import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getInvestments } from '../graphql/queries'
import { Investment } from '../API'
import { RootState } from '../store'
// Define a type for the slice state
interface AccountsState {
    acccountRecommendation: string
    investments: Investment[] | undefined
    cursor: string | undefined
    loading: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: AccountsState = {
    acccountRecommendation: '',
    error: undefined,
    loading: false,
    investments: undefined,
    cursor: undefined,
}

export interface GetInvestmentInput {
    client: any
    id: string
    append: boolean
}

export interface GetInvestmentRecommendation {
    id: string
}

export const getInvestementsAsync = createAsyncThunk<
    any, // Return type
    GetInvestmentInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investments', async (input: GetInvestmentInput, getThunk) => {
    console.log(getThunk.getState())
    const res = await input.client.graphql({
        query: getInvestments,
        variables: { id: input.id, cursor: getThunk.getState().investments.cursor },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, investments: res.data?.getInvestments?.transactions }
    }
    return {
        investments: input.append
            ? [...(getThunk.getState() as any).investments.investments, ...res.data.getInvestments.transactions]
            : res.data.getInvestments.transactions,
        cursor: res.data.getInvestments.cursor,
        loading: false,
    }
})

export const investmentSlice = createSlice({
    name: 'investment',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getInvestementsAsync.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors : undefined
            state.investments = action.payload.investments ?? []
            state.cursor = action.payload.cursor
            state.loading = false
        })
        builder.addCase(getInvestementsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.investments = (action.payload as any)?.investments ?? []
            state.loading = false
        })
        builder.addCase(getInvestementsAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
    },
})

export const { removeError } = investmentSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default investmentSlice.reducer
