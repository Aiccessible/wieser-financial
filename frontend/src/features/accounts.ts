import { GetThunkAPI, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAccounts } from '../graphql/queries'
import { Account } from '../API'
import { completeChatFromPrompt } from '../libs/gpt'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
// Define a type for the slice state
interface AccountsState {
    acccountRecommendation: string
    accounts: Account[] | undefined
    loading: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: AccountsState = {
    acccountRecommendation: '',
    error: undefined,
    loading: false,
    accounts: undefined,
}

export interface GetAccountsInput {
    client: { graphql: GraphQLMethod }
    id: string
}

export interface GetAccountRecommendation {
    id: string
}

export const getAccountsAsync = createAsyncThunk('account/get-accounts', async (input: GetAccountsInput) => {
    const res = await input.client.graphql({
        query: getAccounts,
        variables: { id: input.id },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, accounts: res.data.getAccounts }
    }
    return { accounts: res.data.getAccounts }
})

const getStorageKey = (id: string) => {
    const currentDate = new Date().toISOString().split('T')[0] // Get the date in YYYY-MM-DD format
    return `accountrecommendation-${id}-${currentDate}`
}

export const getAccountRecommendationAsync = createAsyncThunk(
    'account/get-recommendation',
    async (input: GetAccountRecommendation, getThunkApi: GetThunkAPI<any>) => {
        if (localStorage.getItem(getStorageKey(input.id))) {
            return { accountRecommendation: localStorage.getItem(getStorageKey(input.id)) }
        }
        const res = await completeChatFromPrompt(
            'Recommend the user to change their distribution of funds based on the following allocations, example recommendations include: opening new accounts which have tax benefits, closing accounts, moving money between accounts to pay debt etc... \n Accounts:' +
                JSON.stringify((getThunkApi.getState() as any).accounts.accounts)
        )
        localStorage.setItem(getStorageKey(input.id), res.content || '')
        return { accountRecommendation: res.content }
    }
)
export const getAccountBalanceMultipler = (acc: Account) => (acc.type === 'loan' || acc.type === 'credit' ? -1 : 1)

export const reduceAccounts = (accs: Account[]) =>
    accs.reduce(
        (val: number, acc) => val + getAccountBalanceMultipler(acc) * parseFloat(acc.balances?.current || '0'),
        0
    )
export const selectNetWorth = (state: RootState) => reduceAccounts(state.accounts.accounts ?? [])?.toFixed(2)
export const accountSlice = createSlice({
    name: 'account',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getAccountsAsync.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.accounts = action.payload.accounts ?? []
            state.loading = false
        })
        builder.addCase(getAccountsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.accounts = (action.payload as any)?.accounts ?? []
            state.loading = false
        })
        builder.addCase(getAccountsAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
        builder.addCase(getAccountRecommendationAsync.fulfilled, (state, action) => {
            state.acccountRecommendation = action.payload.accountRecommendation || ''
            state.loading = false
        })
        builder.addCase(getAccountRecommendationAsync.rejected, (state, action) => {
            state.error = 'Failed to get recommendations because ' + action.error.message
            state.loading = false
        })
        builder.addCase(getAccountRecommendationAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
    },
})

export const { removeError } = accountSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default accountSlice.reducer
