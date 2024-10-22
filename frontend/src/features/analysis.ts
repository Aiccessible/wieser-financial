import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getFinancialRecommendationsFromData } from '../libs/gpt'
import { RootState } from '../store'
import { Recommendation } from '../API'
// Define a type for the slice state
interface AnalysisState {
    fullPictureRecommendations: Recommendation[]
    loading: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: AnalysisState = {
    fullPictureRecommendations: [],
    error: undefined,
    loading: false,
}

export interface GetFullPictureRecommendationInput {
    id: string
    client: any
}

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
    },
})

export const { removeError } = analysisSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default analysisSlice.reducer
