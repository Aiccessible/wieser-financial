import { configureStore } from '@reduxjs/toolkit'
import accounts from './features/accounts'
import transactions from './features/transactions'
import investments from './features/investments'
import analysis from './features/analysis'
import auth from './features/auth'
import chat from './features/chat'
import idsSlice from './features/items'
import netWorthSlice from './features/networth'
import budgetSlice from './features/budgets'
import simulations from './features/simulations'
// ...
export const store = configureStore({
    reducer: {
        accounts,
        investments,
        analysis,
        auth,
        chat,
        transactions,
        idsSlice,
        netWorthSlice,
        budgetSlice,
        simulations,
    },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
