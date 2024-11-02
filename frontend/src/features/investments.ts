import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getFinancialConversationResponse, getInvestments } from '../graphql/queries'
import { CacheType, ChatFocus, ChatType, Investment, Security } from '../API'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { get, post } from 'aws-amplify/api'
import { getIdFromSecurity } from '../libs/utlis'
// Define a type for the slice state

export interface InvestmentKnoweldgeViewModel {
    analysis: string
    news: string
    loadingAnalysis: boolean
    loadingNews: boolean
    priceData: number[]
}
interface InvestmentsState {
    investments: Investment[] | undefined
    investmentSummary: string | undefined
    cursor: string | undefined
    loading: boolean
    loadingSummary: boolean
    error: string | undefined
    investmentKnoweldge: Record<string, InvestmentKnoweldgeViewModel>
    activeStock: Security | undefined
}

// Define the initial state using that type
const initialState: InvestmentsState = {
    error: undefined,
    loading: false,
    investments: undefined,
    cursor: undefined,
    loadingSummary: false,
    investmentSummary: undefined,
    investmentKnoweldge: {},
    activeStock: undefined,
}

export interface GetInvestmentInput {
    client: { graphql: GraphQLMethod }
    id: string
    append: boolean
}

export interface GetInvestmentNewsSummaryInput {
    client: { graphql: GraphQLMethod }
    id: string
}

export interface GetInvestmentNewsInput {
    client: { graphql: GraphQLMethod }
    security: Security | undefined | null
    id: string
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

const getStorageKey = (id: string) => {
    const currentDate = new Date().toISOString().split('T')[0] // Get the date in YYYY-MM-DD format
    return `newssummary-${id}-${currentDate}`
}

const getNewsKey = (id: string) => {
    const formattedDate = new Date().toISOString().replace('T', '-').split(':')[0]
    return `newsstocksummary-${id}-${formattedDate}`
}

const getAnalysisKey = (id: string) => {
    const formattedDate = new Date().toISOString().replace('T', '-').split(':')[0]
    return `analysissummary-${id}-${formattedDate}`
}

export const getInvestmentNewsSummary = createAsyncThunk<
    any, // Return type
    GetInvestmentNewsSummaryInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investment-news-summary', async (input: GetInvestmentNewsSummaryInput, getThunk) => {
    if (localStorage.getItem(getStorageKey(input.id))) {
        return { investmentSummary: localStorage.getItem(getStorageKey(input.id)) }
    }
    // TODO: Either add streaming ability or turn it off
    const res = await input.client.graphql({
        query: getFinancialConversationResponse,
        variables: {
            chat: {
                accountId: input.id ?? '',
                prompt: 'Provide me the news summary for the investments which I will send in the prompt as well',
                chatFocus: ChatFocus.Investment,
                chatType: ChatType.FinancialNewsQuery,
                requiresLiveData: true,
                shouldRagFetch: true,
                cacheIdentifiers: [{ key: input.id + 'SUMMARY', cacheType: CacheType.PortfolioAnalysis }],
            },
        },
    })
    res.data?.getFinancialConversationResponse?.response &&
        localStorage.setItem(getStorageKey(input.id), res.data?.getFinancialConversationResponse?.response)
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, investmentSummary: res.data?.getFinancialConversationResponse?.response }
    }
    return {
        investmentSummary: res.data.getFinancialConversationResponse?.response,
        loading: false,
    }
})

export const getInvestmentNews = createAsyncThunk<
    any, // Return type
    GetInvestmentNewsInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investment-news', async (input: GetInvestmentNewsInput, getThunk) => {
    const idForSecurity = input?.security ? getIdFromSecurity(input?.security) : ''

    if (localStorage.getItem(getNewsKey(idForSecurity))) {
        return { value: localStorage.getItem(getNewsKey(idForSecurity)), key: idForSecurity }
    }
    // TODO: Either add streaming ability or turn it off
    const res = await input.client.graphql({
        query: getFinancialConversationResponse,
        variables: {
            chat: {
                accountId: input.id ?? '',
                prompt:
                    'Provide me the news summary for the investments which I will send in the prompt as well tickers' +
                    idForSecurity,
                chatType: ChatType.FinancialNewsQuery,
                requiresLiveData: true,
                shouldRagFetch: false,
                cacheIdentifiers: [{ key: idForSecurity, cacheType: CacheType.StockNews }],
            },
        },
    })
    res.data?.getFinancialConversationResponse?.response &&
        localStorage.setItem(getNewsKey(idForSecurity), res.data?.getFinancialConversationResponse?.response)
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, value: res.data?.getFinancialConversationResponse?.response, key: idForSecurity }
    }
    return {
        value: res.data.getFinancialConversationResponse?.response,
        loading: false,
        key: idForSecurity,
    }
})

export const getInvestmentAnalysis = createAsyncThunk<
    any, // Return type
    GetInvestmentNewsInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investment-analysis', async (input: GetInvestmentNewsInput, getThunk) => {
    let priceData: number[] = []
    const endDate = new Date() // Current date
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 14) // 2 weeks (14 days) before the current date
    const idForSecurity = input?.security ? getIdFromSecurity(input?.security) : ''
    try {
        if (input.security?.ticker_symbol) {
            const { body } = await post({
                apiName: 'plaidapi',
                path: `/v1/stock/${input.security?.ticker_symbol}/closing-prices`,
                options: {
                    body: {
                        start_date: startDate.toISOString().split('T')[0], // Format as "YYYY-MM-DD"
                        end_date: endDate.toISOString().split('T')[0],
                    },
                },
            }).response
            console.log(await body.json())
            priceData = (await body.json()) as number[]
        }
    } catch (e) {
        console.log(e)
    }
    if (localStorage.getItem(getAnalysisKey(idForSecurity))) {
        return { value: localStorage.getItem(getAnalysisKey(idForSecurity)), key: idForSecurity, priceData }
    }
    // TODO: Either add streaming ability or turn it off
    const res = await input.client.graphql({
        query: getFinancialConversationResponse,
        variables: {
            chat: {
                accountId: input.id ?? '',
                prompt:
                    'Provide me the technical analysis for the investments which I will send in the prompt as well tickers ' +
                    idForSecurity +
                    ' The daily closes of the last two weeks are ' +
                    priceData.map((prive) => prive.toFixed(2)),
                chatType: ChatType.FinancialAnalysisQuery,
                requiresLiveData: true,
                shouldRagFetch: false,
                cacheIdentifiers: [{ key: idForSecurity, cacheType: CacheType.StockAnalysis }],
            },
        },
    })
    res.data?.getFinancialConversationResponse?.response &&
        localStorage.setItem(getAnalysisKey(idForSecurity), res.data?.getFinancialConversationResponse?.response)
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, value: res.data?.getFinancialConversationResponse?.response, key: idForSecurity, priceData }
    }
    return {
        value: res.data.getFinancialConversationResponse?.response,
        loading: false,
        key: idForSecurity,
        priceData,
    }
})

export const investmentSlice = createSlice({
    name: 'investment',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        removeError: (state) => {
            state.error = undefined
        },
        setActiveStock: (state, action) => {
            state.activeStock = action.payload
        },
    },
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
        builder.addCase(getInvestmentNewsSummary.fulfilled, (state, action) => {
            console.log(action.payload)
            state.error = action.payload.errors ? action.payload.errors : undefined
            state.investmentSummary = action.payload.investmentSummary ?? 'Could not get summary'
            state.loadingSummary = false
        })
        builder.addCase(getInvestmentNewsSummary.rejected, (state, action) => {
            state.error = 'Failed to summarize investments ' + action.error.message
            state.investmentSummary = (action.payload as any)?.investmentSummary ?? 'Could not get summary'
            state.loadingSummary = false
        })
        builder.addCase(getInvestmentNewsSummary.pending, (state, action) => {
            state.error = undefined
            state.loadingSummary = true
        })
        builder.addCase(getInvestmentNews.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors : undefined
            if (!state.investmentKnoweldge[action.payload?.key ?? '']) {
                return
            }
            state.investmentKnoweldge[action.payload?.key ?? ''].news = action.payload?.value ?? 'Could not get summary'
            state.investmentKnoweldge[action.payload?.key ?? ''].loadingNews = false
        })
        builder.addCase(getInvestmentNews.rejected, (state, action) => {
            state.error = 'Failed to summarize investments ' + action.error.message
            if (!state.investmentKnoweldge[(action.payload as any)?.key ?? '']) {
                return
            }
            state.investmentKnoweldge[(action.payload as any)?.key ?? ''].news =
                (action.payload as any)?.value ?? 'Could not get summary'
            state.investmentKnoweldge[(action.payload as any)?.key ?? ''].loadingNews = false
        })
        builder.addCase(getInvestmentNews.pending, (state, action) => {
            const id = action.meta.arg.security ? getIdFromSecurity(action.meta.arg.security) : ''
            state.error = undefined
            state.investmentKnoweldge = {
                ...state.investmentKnoweldge,
                [id]: state.investmentKnoweldge[id] ?? {},
            }
            state.investmentKnoweldge[id].loadingNews = true
        })
        builder.addCase(getInvestmentAnalysis.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors : undefined
            if (!state.investmentKnoweldge[action.payload?.key ?? '']) {
                return
            }
            state.investmentKnoweldge[action.payload?.key ?? ''].analysis =
                action.payload?.value ?? 'Could not get summary'
            state.investmentKnoweldge[action.payload?.key ?? ''].priceData = action.payload?.priceData ?? []
            state.investmentKnoweldge[action.payload?.key ?? ''].loadingAnalysis = false
        })
        builder.addCase(getInvestmentAnalysis.rejected, (state, action) => {
            state.error = 'Failed to summarize investments ' + action.error.message
            if (!state.investmentKnoweldge[(action.payload as any)?.key ?? '']) {
                return
            }
            state.investmentKnoweldge[(action.payload as any)?.key ?? ''].analysis =
                (action.payload as any)?.value ?? 'Could not get summary'
            state.investmentKnoweldge[(action.payload as any)?.key ?? ''].loadingAnalysis = false
            state.investmentKnoweldge[(action.payload as any)?.key ?? ''].priceData =
                (action.payload as any)?.priceData ?? []
        })
        builder.addCase(getInvestmentAnalysis.pending, (state, action) => {
            const id = action.meta.arg.security ? getIdFromSecurity(action.meta.arg.security) : ''
            state.error = undefined
            state.investmentKnoweldge = {
                ...state.investmentKnoweldge,
                [id]: state.investmentKnoweldge[id] ?? {},
            }
            state.investmentKnoweldge[id].loadingAnalysis = true
        })
    },
})

export const { removeError, setActiveStock } = investmentSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default investmentSlice.reducer
