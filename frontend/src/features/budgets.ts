import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getBudgets } from '../graphql/queries'
import { BudgetPlan } from '../API'
import { GraphQLMethod } from '@aws-amplify/api-graphql'
import { createBudget } from '../graphql/mutations'
// Define a type for the slice state
interface BudgetsState {
    budgets: BudgetPlan[] | undefined
    loading: boolean
    creatingBudget: boolean
    hasLoaded: boolean
    error: string | undefined
}

// Define the initial state using that type
const initialState: BudgetsState = {
    budgets: undefined,
    error: undefined,
    loading: false,
    hasLoaded: false,
    creatingBudget: false,
}

export interface GetIdsInput {
    client: { graphql: GraphQLMethod }
}

export interface CreateBudgetInput {
    client: { graphql: GraphQLMethod }
    budget: BudgetPlan
}

export interface GetAccountRecommendation {
    id: string
}

export const getBudgetsAsync = createAsyncThunk('budgets/get-budgets', async (input: GetIdsInput) => {
    const res = await input.client.graphql({
        query: getBudgets,
        variables: {
            id: 'v0',
        },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, budgets: res.data.getBudgets.budgets }
    }
    return { budgets: res.data.getBudgets.budgets }
})

export const addBudget = createAsyncThunk('budgets/save-budgets', async (input: CreateBudgetInput) => {
    const { budget } = input
    console.info(budget, 234)
    const res = await input.client.graphql({
        query: createBudget,
        variables: {
            budget: {
                highLevelCategory: budget.highLevelCategory, // Message field
                timeframe: budget.timeframe, // Time field
                spendingThreshold: budget.spendingThreshold,
                createdAt: Date.now().toString(),
                recommendationTitle: budget.recommendationTitle,
            },
        },
    })
    const errors = res.errors
    if (errors && errors.length > 0) {
        return { errors, budget: res.data.createBudget }
    }
    return { budget: res.data.createBudget }
})

export const budgetsSlice = createSlice({
    name: 'budgets',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: { removeError: (state) => (state.error = undefined) },
    extraReducers(builder) {
        builder.addCase(getBudgetsAsync.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.budgets = (action.payload.budgets as BudgetPlan[]) ?? []
            state.loading = false
            state.hasLoaded = true
        })
        builder.addCase(getBudgetsAsync.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.budgets = (action.payload as any)?.budgets ?? []
            state.loading = false
            state.hasLoaded = true
        })
        builder.addCase(getBudgetsAsync.pending, (state, action) => {
            state.error = undefined
            state.loading = true
        })
        builder.addCase(addBudget.fulfilled, (state, action) => {
            state.error = action.payload.errors ? action.payload.errors?.toString() : undefined
            state.budgets = [...(state.budgets ?? []), action.payload.budget as BudgetPlan]
            state.creatingBudget = false
        })
        builder.addCase(addBudget.rejected, (state, action) => {
            state.error = 'Failed to fetch accounts because ' + action.error.message
            state.budgets = (action.payload as any)?.budget
                ? [...(state.budgets ?? []), (action.payload as any).budget as BudgetPlan]
                : state.budgets
            state.creatingBudget = false
        })
        builder.addCase(addBudget.pending, (state, action) => {
            state.error = undefined
            state.creatingBudget = true
        })
    },
})

export const { removeError } = budgetsSlice.actions

// Other code such as selectors can use the imported `RootState` type

export default budgetsSlice.reducer
