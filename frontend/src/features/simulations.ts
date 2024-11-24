import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getUserAnalysis, getUserAnalysisFields } from '../graphql/queries'
import { Analysis, AnalysisField, AnalysisFieldInput, AnalysisInput, Item } from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { createAnalysis, createAnalysisField } from '../graphql/mutations'
// Define a type for the slice state
interface SimulationState {
    simulations: (Analysis | null)[] | undefined
    analysisFields: (AnalysisField | null)[] | undefined
    loading: boolean
    creating: boolean
    creatingField: boolean
    loadingFields: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: SimulationState = {
    simulations: undefined,
    error: undefined,
    loading: false,
    loadingFields: false,
    analysisFields: undefined,
    creating: false,
    creatingField: false,
}

export interface GetSimulations {
    client: { graphql: GraphQLMethod }
}

export interface CreateSimulation {
    client: { graphql: GraphQLMethod }
    simulation: AnalysisInput
}

export interface CreateSimulationField {
    client: { graphql: GraphQLMethod }
    simulation: AnalysisFieldInput
}

export interface GetAccountRecommendation {
    id: string
}

export const getUserAnalysesAsync = createAsyncThunk('sims/get-user-analyses', async (input: GetSimulations) => {
    const res = await input.client.graphql({
        query: getUserAnalysis,
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, simulations: res.data.getUserAnalysis }
    }
    return { simulations: res.data.getUserAnalysis }
})

export const getUserAnalysesFieldsAsync = createAsyncThunk(
    'sims/get-user-analyses-fields',
    async (input: GetSimulations) => {
        const res = await input.client.graphql({
            query: getUserAnalysisFields,
        })
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, simulationFields: res.data.getUserAnalysisFields }
        }
        return { simulationFields: res.data.getUserAnalysisFields }
    }
)

export const createUserAnalysisAsync = createAsyncThunk(
    'sims/create-user-analyses',
    async (input: CreateSimulation) => {
        const res = await input.client.graphql({
            query: createAnalysis,
            variables: { analysis: input.simulation },
        })
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, simulation: res.data.createAnalysis }
        }
        return { simulation: res.data.createAnalysis }
    }
)

export const createUserAnalysisFieldAsync = createAsyncThunk(
    'sims/create-user-analyses-fields',
    async (input: CreateSimulationField) => {
        const res = await input.client.graphql({
            query: createAnalysisField,
            variables: { analysisField: input.simulation },
        })
        const errors = res.errors
        if (errors && errors.length > 0) {
            return { errors, simulationField: res.data.createAnalysisField }
        }
        return { simulationField: res.data.createAnalysisField }
    }
)

export const simulationSlice = createSlice({
    name: 'sims',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(createUserAnalysisFieldAsync.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            const currentIndex =
                state.analysisFields?.findIndex((el) => el?.inputName === action.payload.simulationField.inputName) ?? 0
            if (currentIndex > -1) {
                state.analysisFields![currentIndex] = action.payload.simulationField
            } else {
                state.analysisFields?.push(action.payload.simulationField)
            }
            state.creatingField = false
        })
        builder.addCase(createUserAnalysisFieldAsync.rejected, (state, action) => {
            state.error = 'Failed to create analysis ' + action.error.message
            const field = (action.payload as any)?.simulationFields
            if (state.analysisFields && field) {
                const currentIndex = state.analysisFields?.findIndex((el) => el?.inputName === field.inputName) ?? 0
                if (currentIndex > -1) {
                    state.analysisFields![currentIndex] = field
                } else {
                    state.analysisFields?.push(field)
                }
            } else if (field) {
                state.analysisFields = [field]
            }
            state.creatingField = false
        })
        builder.addCase(createUserAnalysisFieldAsync.pending, (state, action) => {
            state.error = undefined
            state.creatingField = true
        })
        builder.addCase(createUserAnalysisAsync.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            if (state.simulations) {
                const currentIndex = state.simulations.findIndex(
                    (el) => el?.analysisName === action.payload.simulation.analysisName
                )
                if (currentIndex > -1) {
                    state.simulations[currentIndex] = action.payload.simulation
                } else {
                    state.simulations.push(action.payload.simulation)
                }
            } else {
                state.simulations = [action.payload.simulation]
            }
            state.creating = false
        })
        builder.addCase(createUserAnalysisAsync.rejected, (state, action) => {
            state.error = 'Failed to create analysis ' + action.error.message
            const field = (action.payload as any)?.simulation
            if (state.simulations && field) {
                state.simulations.push(field)
            } else if (field) {
                state.simulations = [field]
            }
            state.creating = false
        })
        builder.addCase(createUserAnalysisAsync.pending, (state, action) => {
            state.error = undefined
            state.creating = true
        })
        builder.addCase(getUserAnalysesAsync.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.simulations = action.payload.simulations ?? []
            state.loading = false
        })
        builder.addCase(getUserAnalysesAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.simulations = (action.payload as any)?.simulations ?? []
            state.loading = false
        })
        builder.addCase(getUserAnalysesAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
        builder.addCase(getUserAnalysesFieldsAsync.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.analysisFields = action.payload.simulationFields ?? []
            state.loadingFields = false
        })
        builder.addCase(getUserAnalysesFieldsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.analysisFields = (action.payload as any)?.simulationFields ?? []
            state.loadingFields = false
        })
        builder.addCase(getUserAnalysesFieldsAsync.pending, (state, action) => {
            state.error = undefined
            state.loadingFields = true
        })
    },
})

export const { removeError } = simulationSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default simulationSlice.reducer
