import { GetThunkAPI, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAccounts, getNetWorth } from '../graphql/queries'
import { Account, NetWorth, NetWorthSummaryType, SpendingSummaryType } from '../API'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { identifyAccountType } from '../components/Analysis/PersonalFinance'
// Define a type for the slice state
interface AccountsState {
    networths: NetWorth[] | undefined
    loading: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: AccountsState = {
    error: undefined,
    loading: false,
    networths: undefined,
}

export interface GetNetworthsInput {
    client: { graphql: GraphQLMethod }
    id: string
    minDate?: number | undefined
    maxDate?: number | undefined
}

export interface GetAccountRecommendation {
    id: string
}

export const getNetworths = createAsyncThunk('networth/get-net-worths', async (input: GetNetworthsInput) => {
    let endDate
    let startDate
    endDate = new Date()
    startDate = new Date()
    startDate.setDate(endDate.getDate() - 14)
    startDate = startDate.getTime()
    endDate = endDate.getTime()
    const res = await input.client.graphql({
        query: getNetWorth,
        variables: {
            id: input.id,
            ...(input.minDate ? { minDate: input.minDate.toString() } : {}),
            ...(input.maxDate ? { maxDate: input.maxDate.toString() } : {}),
            type: NetWorthSummaryType.NETWORTHDAILYSNAPSHOT,
        },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, netWorths: res.data.getNetWorth }
    }
    return { netWorths: res.data.getNetWorth }
})
export const netWorthsSlice = createSlice({
    name: 'networth',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getNetworths.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.networths = (action.payload as any).netWorths ?? []
            state.loading = false
        })
        builder.addCase(getNetworths.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.networths = (action.payload as any)?.netWorths ?? []
            state.loading = false
        })
        builder.addCase(getNetworths.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
    },
})

export const { removeError } = netWorthsSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default netWorthsSlice.reducer
