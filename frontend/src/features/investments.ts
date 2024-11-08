import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { getFinancialConversationResponse, getInvestments } from '../graphql/queries'
import { CacheType, ChatFocus, ChatType, Holding, Investment, Security } from '../API'
import { RootState } from '../store'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { post } from 'aws-amplify/api'
import { getIdFromSecurity } from '../libs/utlis'
import { Investment as InvestmentType } from '../API'
// Define a type for the slice state

export interface InvestmentKnoweldgeViewModel {
    analysis: string
    news: string
    loadingAnalysis: boolean
    loadingNews: boolean
    priceData: number[]
    loadingStockPrices: boolean
}

export interface StockPriceData {
    price: number[]
    loading: boolean
    security: Security | undefined
    holding: Holding | undefined
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
    stockPriceData: Record<string, StockPriceData> | undefined
    loadingStockPrices: boolean
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
    stockPriceData: undefined,
    loadingStockPrices: false,
}

export interface GetInvestmentInput {
    client: { graphql: GraphQLMethod }
    id: string
    append: boolean
}

export interface GetInvestmentNewsSummaryInput {
    client: { graphql: GraphQLMethod }
    ids: string[]
}

export enum AnalysisType {
    WEEKLY,
    DAILY,
}

export interface GetInvestmentNewsInput {
    client: { graphql: GraphQLMethod }
    security: Security | undefined | null
    analysisType?: AnalysisType
}

export interface GetInvestmentPrices {
    client: { graphql: GraphQLMethod }
    securities: {
        security: Security | undefined
        holding: Holding
    }[]
}

export interface GetInvestmentRecommendation {
    id: string
}

export const getInvestementsAsync = createAsyncThunk<
    any, // Return type
    GetInvestmentInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investments', async (input: GetInvestmentInput, getThunk) => {
    const res = await input.client.graphql({
        query: getInvestments,
        variables: { id: input.id, cursor: getThunk.getState()?.investments?.cursor },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, investments: res.data?.getInvestments?.transactions }
    }
    return {
        investments: input.append
            ? [
                  ...((getThunk.getState() as any)?.investments?.investments ?? []),
                  ...res.data.getInvestments.transactions,
              ]
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
    const key = input.ids.join(',')
    if (localStorage.getItem(getStorageKey(key))) {
        return { investmentSummary: localStorage.getItem(getStorageKey(key)) }
    }
    // TODO: Either add streaming ability or turn it off
    const res = await input.client.graphql({
        query: getFinancialConversationResponse,
        variables: {
            chat: {
                accountIds: input.ids,
                prompt: 'Provide me the news summary for the investments which I will send in the prompt as well',
                chatFocus: ChatFocus.Investment,
                chatType: ChatType.FinancialNewsQuery,
                requiresLiveData: true,
                shouldRagFetch: true,
                cacheIdentifiers: [{ key: input.ids.join(',') + 'SUMMARY', cacheType: CacheType.PortfolioAnalysis }],
            } as any,
        },
    })
    res.data?.getFinancialConversationResponse?.response &&
        localStorage.setItem(getStorageKey(key), res.data?.getFinancialConversationResponse?.response)
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
                prompt:
                    'Provide me the news summary for the investments which I will send in the prompt as well tickers' +
                    idForSecurity,
                chatType: ChatType.FinancialNewsQuery,
                requiresLiveData: true,
                doNotUseAdvancedRag: true,
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

export const getInvestmentStockPrices = createAsyncThunk<
    any, // Return type
    GetInvestmentPrices, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investment-prices', async (input: GetInvestmentPrices, getThunk) => {
    const endDate = new Date() // Current date
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 14) // 2 weeks (14 days) before the current date
    function chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize))
        }
        return chunks
    }

    const batchedObjects = await Promise.all(
        chunkArray(input.securities.slice(0, 20), 5).map(async (securityBatch) => {
            const uniqueSecurityBatch = new Map<string, { security: Security | undefined; holding: Holding }>()

            securityBatch.forEach((joinedData) => {
                const { security } = joinedData
                const idForSecurity = security ? getIdFromSecurity(security) : ''

                if (!uniqueSecurityBatch.has(idForSecurity)) {
                    uniqueSecurityBatch.set(idForSecurity, joinedData)
                }
            })
            const deduplicatedBatch = Array.from(uniqueSecurityBatch.values())

            return await Promise.all(
                deduplicatedBatch.map(async (joinedData) => {
                    const { security, holding } = joinedData
                    let priceData: number[] = []
                    const idForSecurity = security ? getIdFromSecurity(security) : ''

                    try {
                        if (security?.ticker_symbol) {
                            const { body } = await post({
                                apiName: 'plaidapi',
                                path: `/v1/stock/${security?.ticker_symbol}/closing-prices`,
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
                        return { [idForSecurity]: { price: priceData, security, holding } }
                    } catch (e) {
                        console.log(e)
                    }
                })
            )
        })
    )

    // Flatten the array of batches into a single array of objects
    const objects = batchedObjects.flat()

    return {
        loading: false,
        objects,
    }
})

export const stockPromptBuilder = (priceData: number[], idForSecurity: string, analysisType?: AnalysisType) => {
    if (!analysisType || (analysisType as any) === AnalysisType.WEEKLY) {
        return (
            'Provide me the technical analysis for the investments which I will send in the prompt as well tickers ' +
            idForSecurity +
            ' The daily closes of the last two weeks are ' +
            priceData!.map((prive) => prive.toFixed(2))
        )
    } else if (analysisType === AnalysisType.DAILY) {
        return (
            'This is my biggest moving stock in today, can you explain why is moving so much' +
            idForSecurity +
            ' The daily closes the last 3 days are ' +
            priceData!.slice(0, 3).map((prive) => prive.toFixed(2))
        )
    }
}

export const getInvestmentAnalysis = createAsyncThunk<
    any, // Return type
    GetInvestmentNewsInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('investment/get-investment-analysis', async (input: GetInvestmentNewsInput, getThunk) => {
    console.info(getThunk.getState().investments.stockPriceData, 'prive data')
    const arrayOfRecords = getThunk.getState().investments.stockPriceData as any as Record<string, StockPriceData>[]
    const keyLookingFor = getIdFromSecurity(input?.security ?? undefined)
    let priceData = Object.values(arrayOfRecords?.find((el) => Object.keys(el)[0] === keyLookingFor) ?? {})?.[0]?.price
    console.log(priceData, 234)
    const endDate = new Date() // Current date
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 14) // 2 weeks (14 days) before the current date
    const idForSecurity = input?.security ? getIdFromSecurity(input?.security) + (input.analysisType ?? '') : ''
    try {
        if (input.security?.ticker_symbol && !priceData) {
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
        return {
            value: localStorage.getItem(getAnalysisKey(idForSecurity)),
            key: idForSecurity,
            priceData,
        }
    }
    // TODO: Either add streaming ability or turn it off
    console.log(priceData, 897)
    const res = await input.client.graphql({
        query: getFinancialConversationResponse,
        variables: {
            chat: {
                prompt: stockPromptBuilder(
                    priceData,
                    getIdFromSecurity(input.security ?? undefined),
                    input.analysisType
                ),
                chatType: ChatType.FinancialAnalysisQuery,
                requiresLiveData: true,
                doNotUseAdvancedRag: true,
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
        builder.addCase(getInvestmentStockPrices.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors : undefined
            state.stockPriceData = action.payload?.objects ?? []
            state.loadingStockPrices = false
        })
        builder.addCase(getInvestmentStockPrices.rejected, (state, action) => {
            state.error = 'Failed to summarize investments ' + action.error.message
            state.stockPriceData = (action.payload as any)?.objects ?? []
        })
        builder.addCase(getInvestmentStockPrices.pending, (state, action) => {
            if (!state.stockPriceData) {
                state.stockPriceData = {}
            }
            state.loadingStockPrices = true
            action.meta.arg.securities.forEach((security) => {
                const id = security ? getIdFromSecurity(security?.security) : ''
                state.stockPriceData![id] = { loading: true, price: [], security: undefined, holding: undefined }
            })
            state.error = undefined
        })
    },
})

const ID_SEPERATOR = '-'

export const getId = (el: InvestmentType) => el.account_id + ID_SEPERATOR + el.security_id

export const selectInvestmentsMap = createSelector(
    [(state: RootState) => state.investments.investments],
    (investments) => {
        console.info('invest', investments)
        const accountAndsecurityIdToEntity: Record<string, { security: Security | undefined; holding: Holding }> = {}
        investments?.forEach((el) => {
            if (el.plaid_type === 'Holding') {
                accountAndsecurityIdToEntity[getId(el)] = {
                    security: investments?.find(
                        (sec) => sec.plaid_type === 'Security' && sec.security_id === el.security_id
                    ) as Security | undefined,
                    holding: el as Holding,
                }
            }
        })
        return accountAndsecurityIdToEntity
    }
)

export const selectStockPriceData = (state: RootState) => state.investments.stockPriceData
export const selectTopMovingStocks = createSelector([selectStockPriceData], (stockPrices) => {
    const prices = Object.entries(stockPrices ?? {})
    const securities = prices.map((item) => {
        return getIdFromSecurity(Object.values(item[1] ?? {})?.[0]?.security ?? {})
    })
    const uniqueArray = Array.from(new Set(securities))
    console.info(uniqueArray)
    const resolvedArray = uniqueArray.map((id) =>
        prices.find((el) => getIdFromSecurity(Object.values(el[1] ?? {})?.[0]?.security ?? {}) === id)
    )
    resolvedArray
        ?.filter((a) => a?.[1]?.price)
        .sort(
            (a, b) => a?.[1].price[0] ?? 0 - (a?.[1]?.price[1] ?? 0) - (b?.[1]?.price[0] ?? 0 - (b?.[1]?.price[1] ?? 0))
        )
    const topPrices = resolvedArray.slice(0, 3)
    console.info('here', topPrices)
    return resolvedArray
})
export const { removeError, setActiveStock } = investmentSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default investmentSlice.reducer
