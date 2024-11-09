import { GetThunkAPI, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAccounts, getNetWorths as getNetWorthsQuery } from '../graphql/queries'
import { Account, BudgetPlan, NetWorth, SpendingSummaryType } from '../API'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { identifyAccountType } from '../components/Analysis/PersonalFinance'
// Define a type for the slice state
interface AccountsState {
    networths: NetWorth[] | undefined
    loading: boolean
    error: string | undefined
    budgetAnalysis: BudgetPlan | undefined
}

// Define the initial state using that type
const initialState: AccountsState = {
    error: undefined,
    loading: false,
    networths: undefined,
    budgetAnalysis: undefined,
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

const numToDateString = (x: number) => {
    return new Date(x).toISOString().split('T')[0]
}

export const selectMostRecentNetWorth = (state: RootState): NetWorth => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return (
        state.netWorthSlice.networths?.length &&
        state.netWorthSlice.networths?.reduce((maxSnapshot: any, networth) => {
            const currentSkDate = new Date(networth?.sk ?? 0)
            const maxSkDate = new Date(maxSnapshot?.sk ?? 0)
            return currentSkDate > maxSkDate && currentSkDate < midnight ? networth : maxSnapshot
        }, null)
    )
}

export const selectSortedNetWorths = (state: RootState) => {
    const netWorths = [...(state.netWorthSlice?.networths ?? [])]
    netWorths?.sort((a, b) => {
        const currentSkDate = new Date(a?.sk ?? 0)
        const maxSkDate = new Date(b?.sk ?? 0)
        return currentSkDate?.getTime() - maxSkDate?.getTime()
    })

    return netWorths
}

export const getNetworths = createAsyncThunk('networth/get-net-worths', async (input: GetNetworthsInput) => {
    let endDate
    let startDate
    endDate = new Date()
    startDate = new Date()
    startDate.setDate(endDate.getDate() - 14)
    endDate.setDate(endDate.getDate() + 1)
    startDate = startDate.getTime()
    endDate = endDate.getTime()
    const res = await input.client.graphql({
        query: getNetWorthsQuery,
        variables: {
            id: input.id,
            ...(input.minDate ? { minDate: numToDateString(input.minDate) } : { minDate: numToDateString(startDate) }),
            ...(input.maxDate ? { maxDate: numToDateString(input.maxDate) } : { maxDate: numToDateString(endDate) }),
            type: 'NETWORTHDAILYSNAPSHOT' as any,
        },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, netWorths: res.data.getNetWorths }
    }
    return { netWorths: res.data.getNetWorths }
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
