import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAccounts } from '../graphql/queries'
import { Account } from '../API'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { identifyAccountType } from '../components/Analysis/PersonalFinance'
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
    ids: string[]
}

export interface GetAccountRecommendation {
    id: string
}

export const getAccountsAsync = createAsyncThunk('account/get-accounts', async (input: GetAccountsInput) => {
    const res = await Promise.all(
        input.ids.map(async (id) => {
            const res = await input.client.graphql({
                query: getAccounts,
                variables: { id: id },
            })
            const errors = res.errors
            if (errors && errors.length > 0) {
                return { errors, accounts: res.data.getAccounts }
            }
            return { accounts: res.data.getAccounts }
        })
    )
    const accounts = res.flatMap((el) => el.accounts)
    const errors = res.flatMap((el) => el.errors)
    return { accounts, errors }
})

const getStorageKey = (id: string) => {
    const currentDate = new Date().toISOString().split('T')[0] // Get the date in YYYY-MM-DD format
    return `accountrecommendation-${id}-${currentDate}`
}

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
            state.accounts = [...(action.payload.accounts ?? [])].sort(
                (a1: Account, a2: Account) =>
                    parseFloat(a2?.balances?.current ?? '0') - parseFloat(a1?.balances?.current ?? '0')
            )
            state.loading = false
        })
        builder.addCase(getAccountsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.accounts = [...(state.accounts ?? []), ...((action.payload as any)?.accounts ?? [])]
            state.loading = false
        })
        builder.addCase(getAccountsAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
    },
})

export const selectSpecialAccounts = (state: RootState) => {
    const accounts = state.accounts.accounts
    const rsp = accounts?.filter((account) => identifyAccountType(account) === 'RRSP') ?? []
    const tfsa = accounts?.filter((account) => identifyAccountType(account) === 'TFSA') ?? []
    const fhsa = accounts?.filter((account) => identifyAccountType(account) === 'FHSA') ?? []
    return {
        rsp,
        tfsa,
        fhsa,
    }
}

export const { removeError } = accountSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default accountSlice.reducer
