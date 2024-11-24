import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { CacheType, ChatFocus, ChatType, ExpandFinancialSimulation, Recommendation, RetryCodeBuildInput } from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { post } from 'aws-amplify/api'
import { AccountBalances } from '../components/Analysis/NetworthChart'
import { getFinancialConversationResponse, getFinancialSimulationExpansion, retryCodeBuild } from '../graphql/queries'
import { FinancialProjection } from '../components/hooks/useDefaultValuesForProjection'
import storage from './storage'

// Define a type for the slice state
interface AnalysisState {
    fullPictureRecommendations: Recommendation[] | undefined
    loading: boolean
    error: string | undefined
    projectedAccountBalances: AccountBalances | undefined
    loadingProjections: boolean
    loadingProjectionsError: string | undefined
    budgetPlanProjections: Record<string, AccountBalances | { loading: true }>
    activeBudgetPlan: string | undefined
    generatingSimulation: boolean
    newSimulationInputs: { name: string; defaultValue: string }[] | undefined
    activeSimulationInputs: string[] | undefined
    activeSimulationKey: string | undefined
    activeSimulationDescription: string | undefined
    activeSimulationName: string | undefined
    generationError: string | undefined
    simulationProjections: Record<string, AccountBalances> | undefined
    waitingForCodeGeneration: boolean
    activeSimulationDescriptions: string[] | undefined
    activeSimulationTitles: string[] | undefined
    activeSimulationTitle: string | undefined
    retryCount: number
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
    fullPictureRecommendations: undefined,
    error: undefined,
    loading: false,
    projectedAccountBalances: undefined,
    loadingProjections: false,
    loadingProjectionsError: undefined,
    budgetPlanProjections: {},
    activeBudgetPlan: '',
    activeSimulationDescription: undefined,
    activeSimulationKey: undefined,
    newSimulationInputs: undefined,
    generatingSimulation: false,
    generationError: '',
    simulationProjections: undefined,
    activeSimulationName: undefined,
    activeSimulationInputs: undefined,
    waitingForCodeGeneration: false,
    activeSimulationDescriptions: undefined,
    activeSimulationTitles: undefined,
    activeSimulationTitle: undefined,
    retryCount: 0,
}

export interface GetFullPictureRecommendationInput {
    client: { graphql: GraphQLMethod }
    projection: FinancialProjection
}

export interface GetFinancialProjectionInput {
    client: { graphql: GraphQLMethod }
    input: FinancialInputs
    path?: string | undefined
}

export interface GetFinancialBudgetProjectionInput {
    client: { graphql: GraphQLMethod }
    input: FinancialInputs
    budgetName: string
}

export interface GetFinancialSimulationExpansionInput {
    client: { graphql: GraphQLMethod }
    input: ExpandFinancialSimulation
}

export interface RetryCodeBuildThunkInput {
    client: { graphql: GraphQLMethod }
    input: RetryCodeBuildInput
}

export const financialProjectionToChatInput = (projection: FinancialProjection) => {
    return `my estimated annual post tax income is ${projection.incomeAnnualize} ,
                 my estimated annualized expenses are ${projection.initial_expenses} 
                 my estimated contribution room for the tax accounts are: Tfsa: (balance: ${projection.initial_tfsa_balance} room ${projection.initial_tfsa_room}) 
                (balance: ${projection.initial_rrsp_balance} room ${projection.initial_rrsp_room})
                (balance: ${projection.initial_fhsa_balance} room ${projection.initial_fhsa_room})`
}

export const retryCodeBuildAsyncThunk = createAsyncThunk<
    any, // Return type
    RetryCodeBuildThunkInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/retry-code-build', async (input: RetryCodeBuildThunkInput, getThunkApi) => {
    console.info('invoking')
    const res = await input.client.graphql({
        query: retryCodeBuild,
        variables: { build: input.input },
    })

    return { res }
})

export const getProjection = async (
    input: FinancialInputs,
    path = `/v1/analyze/projection`,
    simulationId: string | undefined = undefined
) => {
    console.info('invoking')
    const { body } = await post({
        apiName: 'plaidapi',
        path: path,
        options: {
            body: {
                ...input,
            },
        },
    }).response
    const data = await body.json()

    return { projection: data, simulationId }
}

export const getFinancialProjection = createAsyncThunk<
    any, // Return type
    GetFinancialProjectionInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/get-financial-projection', async (input: GetFinancialProjectionInput, getThunkApi) => {
    return await getProjection(input.input, input.path ?? '/v1/analyze/projection', input.path ?? undefined)
})

export const getFinancialSimulationExpansionThunk = createAsyncThunk<
    any, // Return type
    GetFinancialSimulationExpansionInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/get-financial-simulation-expansion', async (input: GetFinancialSimulationExpansionInput, getThunkApi) => {
    try {
        const response = await input.client.graphql({
            query: getFinancialSimulationExpansion,
            variables: {
                chat: input.input,
            },
        })
        const recs = response.data.getFinancialSimulationExpansion
        return { simulationExpansion: recs }
    } catch (e) {
        console.error(e)
        throw e
    }
})

export const getFinancialProjectionForBudget = createAsyncThunk<
    any, // Return type
    GetFinancialBudgetProjectionInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/get-financial-projection-for-budget', async (input: GetFinancialBudgetProjectionInput, getThunkApi) => {
    const projection = await getProjection(input.input)
    return { ...projection, budgetName: input.budgetName }
})

export const getFullPictureRecommendationAsync = createAsyncThunk<
    any, // Return type
    GetFullPictureRecommendationInput, // Input type
    { state: RootState } // ThunkAPI type that includes the state
>('analysis/get-analysis', async (input: GetFullPictureRecommendationInput, getThunkApi) => {
    const storedItem = await storage.getItem(getStorageKey('full-picture-recommendation'))
    if (storedItem) {
        return {
            fullPictureRecommendations: JSON.parse(storedItem || ''),
        }
    }
    const ids =
        getThunkApi
            .getState()
            .idsSlice.institutions?.map((account) => account.item_id)
            .slice(0, 25) ?? []
    const res = await input.client.graphql({
        query: getFinancialConversationResponse,
        variables: {
            chat: {
                accountIds: ids,
                prompt: `Provide me financial transfers, spending advice, investment allocations on what actions would help me grow my networth in Canada, ${financialProjectionToChatInput(
                    input.projection
                )}`,
                chatFocus: ChatFocus.All,
                chatType: ChatType.GeneralRecommendation,
                requiresLiveData: false,
                currentDateRange: [
                    (new Date().getTime() - 1000 * 3600 * 24 * 365).toString(),
                    new Date().getTime().toString(),
                ],
                doNotUseAdvancedRag: true,
                cacheIdentifiers: [
                    { key: 'RECOMMENDATIONUMMARIES23' + ids.join(','), cacheType: CacheType.GeneralRecommendation },
                ],
            },
        },
    })
    const recs = res.data.getFinancialConversationResponse.response
    storage.setItem(getStorageKey('full-picture-recommendation'), JSON.stringify(recs))
    return { fullPictureRecommendations: recs }
})

const getStorageKey = (id: string) => {
    const currentDate = new Date().toISOString().split('T')[0] // Get the date in YYYY-MM-DD format
    return `fullpicturerecommendation4332-${id}-${currentDate}`
}

export const analysisSlice = createSlice({
    name: 'analysis',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        removeError: (state) => (state.error = undefined),
        setActiveBudgetPlan: (state, action) => {
            state.activeBudgetPlan = action.payload
            return
        },
        setActiveSimulationName: (state, action) => {
            state.activeSimulationName = action.payload
            if (!action.payload) {
                state.newSimulationInputs = undefined
                state.activeSimulationKey = undefined
                state.activeSimulationInputs = undefined
            }
            return
        },
        setActiveSimulationParams: (state, action) => {
            state.activeSimulationDescription = action.payload.simulationExpansion.description
            state.newSimulationInputs = action.payload.simulationExpansion.inputs
            state.generatingSimulation = false
            state.waitingForCodeGeneration = true
            if (!state.activeSimulationDescriptions) {
                state.activeSimulationDescriptions = [action.payload.simulationExpansion.description]
                state.activeSimulationTitles = [action.payload.simulationExpansion.title]
            } else {
                state.activeSimulationDescriptions.push(action.payload.simulationExpansion.description)
                state.activeSimulationTitles?.push(action.payload.simulationExpansion.title)
            }
            state.activeSimulationName = state.activeSimulationName ?? action.payload.simulationExpansion.title
            state.activeSimulationInputs = state.activeSimulationInputs
                ? [
                      ...state.activeSimulationInputs,
                      ...action.payload.simulationExpansion.inputs?.map((el: any) => el.name),
                  ]
                : state.activeSimulationInputs
            return
        },
        setActiveSimulationS3Params: (state, action) => {
            state.activeSimulationKey = action.payload.simulationExpansion.s3Key
            state.waitingForCodeGeneration = false
            state.loadingProjectionsError = undefined
            return
        },
        setActiveSimulation: (state, action) => {
            state.activeSimulationDescription = action.payload.currentDescription
            state.activeSimulationKey = action.payload.s3Key
            state.activeSimulationInputs = action.payload.currentInputs
            state.activeSimulationName = action.payload.analysisName
            state.activeSimulationDescriptions = action.payload.descriptions
            state.activeSimulationTitles = action.payload.titles
            state.generatingSimulation = false
            return
        },
    },
    extraReducers(builder) {
        builder.addCase(getFullPictureRecommendationAsync.fulfilled, (state, action) => {
            state.fullPictureRecommendations = JSON.parse(
                action.payload.fullPictureRecommendations || ''
            ).recommendations
            state.loading = false
        })
        builder.addCase(getFullPictureRecommendationAsync.rejected, (state, action) => {
            console.error('Failed getting recs', action.error)
            state.error = 'Fgot backailed to get recommendations because ' + action.error.message
            state.loading = false
        })
        builder.addCase(getFullPictureRecommendationAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
        builder.addCase(getFinancialProjectionForBudget.fulfilled, (state, action) => {
            state.budgetPlanProjections = {
                ...state.budgetPlanProjections,
                [action.payload.budgetName]: action.payload.projection,
            }
        })
        builder.addCase(getFinancialProjectionForBudget.rejected, (state, action) => {
            state.error = 'Failed to get recommendations because ' + action.error.message
        })
        builder.addCase(getFinancialProjectionForBudget.pending, (state, action) => {
            state.budgetPlanProjections = {
                ...state.budgetPlanProjections,
                [action.meta.arg.budgetName]: { loading: true },
            }
        })
        builder.addCase(getFinancialProjection.fulfilled, (state, action) => {
            if (action.payload.simulationId) {
                if (!state.simulationProjections) {
                    state.simulationProjections = {}
                }
                state.simulationProjections[state.activeSimulationKey!] = action.payload.projection
                state.activeSimulationInputs = state.activeSimulationInputs
                    ? [...state.activeSimulationInputs, ...(state.newSimulationInputs?.map((el: any) => el.name) ?? [])]
                    : state.newSimulationInputs?.map((el: any) => el.name) ?? []
                state.newSimulationInputs = undefined
                state.loadingProjections = false
            } else {
                state.projectedAccountBalances = action.payload.projection || undefined
                state.loadingProjections = false
            }
            state.retryCount = 0
        })
        builder.addCase(getFinancialProjection.rejected, (state, action) => {
            state.loadingProjectionsError = 'Failed to get projections because ' + action.error.message
            state.loadingProjections = false
        })
        builder.addCase(getFinancialProjection.pending, (state, action) => {
            state.loadingProjectionsError = undefined
            state.loadingProjections = true
        })
        builder.addCase(getFinancialSimulationExpansionThunk.fulfilled, (state, action) => {})
        builder.addCase(getFinancialSimulationExpansionThunk.rejected, (state, action) => {})
        builder.addCase(getFinancialSimulationExpansionThunk.pending, (state, action) => {
            state.generatingSimulation = true
            state.generationError = undefined
        })
        builder.addCase(retryCodeBuildAsyncThunk.pending, (state, action) => {
            state.waitingForCodeGeneration = true
            state.generationError = undefined
            state.retryCount += 1
        })
    },
})

export const {
    removeError,
    setActiveBudgetPlan,
    setActiveSimulationName,
    setActiveSimulationParams,
    setActiveSimulation,
    setActiveSimulationS3Params,
} = analysisSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default analysisSlice.reducer
