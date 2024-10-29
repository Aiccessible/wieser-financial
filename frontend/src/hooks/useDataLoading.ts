import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { getInvestementsAsync } from '../features/investments'
import {
    getTransactionsAsync,
    getYesterdaySummaryAsyncThunk,
    getMonthlySummariesAsyncThunk,
} from '../features/transactions'
import { getAccountsAsync } from '../features/accounts'
import { getFullPictureRecommendationAsync } from '../features/analysis'
import { ConsoleLogger } from 'aws-amplify/utils'
const logger = new ConsoleLogger('DataLoading')
interface DataLoadingInput {
    id: string
    client: any
    loadAccounts?: boolean
    loadInvestments?: boolean
    loadTransactions?: boolean
    loadRecommendations?: boolean
}
export const useDataLoading = (input: DataLoadingInput) => {
    const { id, client, loadAccounts, loadInvestments, loadTransactions, loadRecommendations } = input
    const dispatch = useAppDispatch()

    // Selectors for state data
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const investments = useAppSelector((state) => state.investments.investments)
    const transactions = useAppSelector((state) => state.transactions.transactions)
    const investmentCursor = useAppSelector((state) => state.investments.cursor)
    const transactionCursor = useAppSelector((state) => state.transactions.cursor)
    const transactionsLoading = useAppSelector((state) => state.transactions.loading)

    // Load accounts
    const getAccounts = useCallback(async () => {
        try {
            dispatch(getAccountsAsync({ client, id: id || '' }))
        } catch (err) {
            logger.error('unable to get accounts', err)
        }
    }, [id])

    // Load investments
    const getInvestments = useCallback(async () => {
        try {
            await dispatch(getInvestementsAsync({ client, id: id || '', append: !investmentCursor }))
        } catch (err) {
            logger.error('unable to get investments', err)
        }
    }, [id, investmentCursor])

    // Load transactions
    const getTransactions = useCallback(async () => {
        try {
            dispatch(getYesterdaySummaryAsyncThunk({ id: id || '', client, append: false }))
            dispatch(getMonthlySummariesAsyncThunk({ id: id || '', client, append: false }))
            await dispatch(getTransactionsAsync({ id: id || '', client, append: !transactionCursor }))
        } catch (err) {
            logger.error('unable to get transactions', err)
        }
    }, [id, transactionCursor])

    // Check if investments or transactions are loading
    const isInvestmentsLoading = useCallback(
        () => (!investments || investmentCursor) && (investments?.length ?? 0) < 100,
        [investmentCursor, investments]
    )

    const isTransactionsLoading = useCallback(() => {
        return !transactions
    }, [transactions])

    // Load accounts on mount if not already loaded
    useEffect(() => {
        if (!accounts) {
            loadAccounts && getAccounts()
        }
    }, [accounts, getAccounts, loadAccounts])

    // Load investments based on loading state
    useEffect(() => {
        if (isInvestmentsLoading() && loadInvestments) {
            getInvestments()
        }
    }, [isInvestmentsLoading, getInvestments, loadInvestments])

    // Load transactions based on loading state
    useEffect(() => {
        if (isTransactionsLoading() && loadTransactions && !transactionsLoading) {
            getTransactions()
        }
    }, [isTransactionsLoading, loadTransactions, transactionsLoading])

    // Trigger recommendations once everything else is loaded
    useEffect(() => {
        if (loadRecommendations && accounts?.length && !isTransactionsLoading() && !isInvestmentsLoading()) {
            dispatch(getFullPictureRecommendationAsync({ id: id || '', client }))
        }
    }, [accounts, isTransactionsLoading, isInvestmentsLoading, dispatch, id, loadRecommendations])

    return {
        accounts,
        investments,
        transactions,
        isTransactionsLoading,
        isInvestmentsLoading,
    }
}
