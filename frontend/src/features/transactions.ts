import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getSpendingSummary, getTransactions } from '../graphql/queries'
import { SpendingSummary, SpendingSummaryType, Transaction } from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { stat } from 'fs'
// Define a type for the slice state
interface TransactionsState {
    acccountRecommendation: string
    transactions: Transaction[] | undefined
    cursor: string | undefined
    loading: boolean
    loadingDailySummary: boolean
    loadingMonthlySummary: boolean
    error: string | undefined
    dailySummaries: SpendingSummary[] | undefined
    monthlySummaries: SpendingSummary[] | undefined
}

// Define the initial state using that type
const initialState: TransactionsState = {
    acccountRecommendation: '',
    error: undefined,
    loading: false,
    transactions: undefined,
    cursor: undefined,
    loadingDailySummary: false,
    loadingMonthlySummary: false,
    dailySummaries: undefined,
    monthlySummaries: undefined,
}

export interface GetTransactionInput {
    client: { graphql: GraphQLMethod }
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
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, transactions: res.data.getTransactions }
        }
        return {
            transactions: input.append
                ? [
                      ...((getThunk.getState() as any).transactions.transactions ?? []),
                      ...res.data.getTransactions.transactions,
                  ]
                : res.data.getTransactions.transactions,
            cursor: res.data.getTransactions.cursor,
            loading: false,
        }
    }
)

export const getYesterdaySummaryAsyncThunk = createAsyncThunk(
    'transaction/get-transactions-summary-daily',
    async (input: GetTransactionInput, getThunk: any) => {
        const endDate = new Date() // Current date
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 1)
        const res = await input.client.graphql({
            query: getSpendingSummary,
            variables: {
                id: input.id,
                minDate: startDate.getTime() as any,
                maxDate: endDate.getTime() as any,
                type: SpendingSummaryType.DAILYSUMMARY,
            },
        })
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, summarys: JSON.parse(res.data.getSpendingSummary.spending ?? '') }
        }
        return {
            summarys: JSON.parse(res.data.getSpendingSummary.spending ?? ''),
            loading: false,
        }
    }
)

export const getMonthlySummariesAsyncThunk = createAsyncThunk(
    'transaction/get-transactions-summary-monthly',
    async (input: GetTransactionInput, getThunk: any) => {
        console.log('here')
        const endDate = new Date() // Current date
        const startDate = new Date()
        startDate.setFullYear(endDate.getFullYear() - 1)
        console.log('here2')
        const res = await input.client.graphql({
            query: getSpendingSummary,
            variables: {
                id: input.id,
                minDate: startDate.getTime() as any,
                maxDate: endDate.getTime() as any,
                type: SpendingSummaryType.MONTHLYSUMMARY,
            },
        })
        console.log('h232')
        console.error(res.data?.getSpendingSummary?.spending ?? '', 'geree', res.errors)

        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, summarys: JSON.parse(res.data.getSpendingSummary.spending ?? '') }
        }

        return {
            summarys: JSON.parse(res.data.getSpendingSummary.spending ?? ''),
            loadingSummary: false,
        }
    }
)

export const transactionSlice = createSlice({
    name: 'transaction',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getTransactionsAsync.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors.toString() : undefined
            state.transactions = (action.payload.transactions as any) ?? []
            state.cursor = action.payload.cursor || undefined
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
        builder.addCase(getYesterdaySummaryAsyncThunk.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors.toString() : undefined
            state.loadingDailySummary = false
            state.dailySummaries = action.payload.summarys
        })
        builder.addCase(getYesterdaySummaryAsyncThunk.rejected, (state, action) => {
            state.loadingDailySummary = false
        })
        builder.addCase(getYesterdaySummaryAsyncThunk.pending, (state, action) => {
            state.error = undefined
            state.loadingDailySummary = true
        })
        builder.addCase(getMonthlySummariesAsyncThunk.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors.toString() : undefined
            state.loadingMonthlySummary = false
            state.monthlySummaries = action.payload.summarys
        })
        builder.addCase(getMonthlySummariesAsyncThunk.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.loadingMonthlySummary = false
        })
        builder.addCase(getMonthlySummariesAsyncThunk.pending, (state, action) => {
            state.error = undefined
            state.loadingMonthlySummary = true
        })
    },
})

export const { removeError } = transactionSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default transactionSlice.reducer
