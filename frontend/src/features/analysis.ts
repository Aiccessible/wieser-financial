import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getFinancialRecommendationsFromData } from '../libs/gpt'
import { RootState } from '../store'
import { Recommendation } from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { post } from 'aws-amplify/api'
import { AccountBalances } from '../components/Analysis/NetworthChart'
// Define a type for the slice state
interface AnalysisState {
    fullPictureRecommendations: Recommendation[]
    loading: boolean
    error: string | undefined
    projectedAccountBalances: AccountBalances | undefined
    loadingProjections: boolean
}

export interface FinancialInputs {
    initial_salary: number
    salary_growth: number
    initial_bonus: number
    bonus_growth: number
    initial_expenses: number
    expenses_growth: number
    investment_yield: number
    tax_rate: number
    years: number
    initial_rrsp_balance: number
    initial_fhsa_balance: number
    initial_tfsa_balance: number
    initial_brokerage_balance: number
    initial_rrsp_room: number
    initial_fhsa_room: number
    initial_tfsa_room: number
}

// Define the initial state using that type
const initialState: AnalysisState = {
    fullPictureRecommendations: [],
    error: undefined,
    loading: false,
    projectedAccountBalances: undefined,
    loadingProjections: false,
}

export interface GetFullPictureRecommendationInput {
    id: string
    client: { graphql: GraphQLMethod }
}

export interface GetFinancialProjectionInput {
    id: string
    client: { graphql: GraphQLMethod }
    input: FinancialInputs
}

export const getFinancialProjection = createAsyncThunk<
    any, // Return type
    GetFinancialProjectionInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/get-financial-projection', async (input: GetFinancialProjectionInput, getThunkApi) => {
    const { body } = await post({
        apiName: 'plaidapi',
        path: `/v1/analyze/projection`,
        options: {
            body: {
                ...input.input,
            },
        },
    }).response
    const data = await body.json()

    return { projection: data }
})

export const getFullPictureRecommendationAsync = createAsyncThunk<
    any, // Return type
    GetFullPictureRecommendationInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/get-analysis', async (input: GetFullPictureRecommendationInput, getThunkApi) => {
    const storedItem = localStorage.getItem(getStorageKey(input.id))
    if (storedItem) {
        console.log(storedItem, storedItem || '', JSON.parse(storedItem || ''))
        return {
            fullPictureRecommendations: JSON.parse(storedItem || ''),
        }
    }
    const res = await getFinancialRecommendationsFromData(
        'Recommend the user five financial optimizations based on the following allocations, example recommendations include: opening new accounts which have tax benefits, closing accounts, moving money between accounts to pay debt etc... \n Accounts:' +
            JSON.stringify((getThunkApi.getState() as any).accounts.accounts) +
            ' Investments: ' +
            JSON.stringify(getThunkApi.getState().investments.investments) +
            ' Transactions: ' +
            JSON.stringify(getThunkApi.getState().transactions.transactions),
        input.client
    )
    localStorage.setItem(getStorageKey(input.id), JSON.stringify(res))
    return { fullPictureRecommendations: res }
})

const getStorageKey = (id: string) => {
    const currentDate = new Date().toISOString().split('T')[0] // Get the date in YYYY-MM-DD format
    return `fullpicturerecommendation-${id}-${currentDate}`
}

export const analysisSlice = createSlice({
    name: 'analysis',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getFullPictureRecommendationAsync.fulfilled, (state, action) => {
            state.fullPictureRecommendations = action.payload.fullPictureRecommendations || ''
            state.loading = false
        })
        builder.addCase(getFullPictureRecommendationAsync.rejected, (state, action) => {
            state.error = 'Failed to get recommendations because ' + action.error.message
            state.loading = false
        })
        builder.addCase(getFullPictureRecommendationAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
        builder.addCase(getFinancialProjection.fulfilled, (state, action) => {
            console.log(action.payload.projection)
            state.projectedAccountBalances = action.payload.projection || undefined
            state.loadingProjections = false
        })
        builder.addCase(getFinancialProjection.rejected, (state, action) => {
            state.error = 'Failed to get projections because ' + action.error.message
            state.loadingProjections = false
        })
        builder.addCase(getFinancialProjection.pending, (state, action) => {
            state.error = undefined
            state.loadingProjections = true
        })
    },
})

export const { removeError } = analysisSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default analysisSlice.reducer
