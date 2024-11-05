import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    AnalysisType,
    getInvestementsAsync,
    getInvestmentAnalysis,
    getInvestmentStockPrices,
    selectInvestmentsMap,
    selectTopMovingStocks,
} from '../features/investments'
import {
    getTransactionsAsync,
    getYesterdaySummaryAsyncThunk,
    getMonthlySummariesAsyncThunk,
    selectRegisteredSavingsPerAccounts,
} from '../features/transactions'
import { getAccountsAsync } from '../features/accounts'
import { getFinancialProjection, getFullPictureRecommendationAsync } from '../features/analysis'
import { ConsoleLogger } from 'aws-amplify/utils'
import { useDefaultValuesForProjection } from '../components/hooks/useDefaultValuesForProjection'
import { callFunctionsForEachId } from '../components/Investments'
import { getIdsAsync } from '../features/items'
import { getNetworths } from '../features/networth'
const logger = new ConsoleLogger('DataLoading')
interface DataLoadingInput {
    id: string
    client: any
    loadAccounts?: boolean
    loadInvestments?: boolean
    loadTransactions?: boolean
    loadRecommendations?: boolean
    loadProjection?: boolean
    loadNetworths?: boolean
    loadTopStockAnalysis?: boolean
}
export const useDataLoading = (input: DataLoadingInput) => {
    const {
        id,
        client,
        loadAccounts,
        loadInvestments,
        loadTransactions,
        loadRecommendations,
        loadProjection,
        loadTopStockAnalysis,
    } = input
    const dispatch = useAppDispatch()

    // Selectors for state data
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const investments = useAppSelector((state) => state.investments.investments)
    const transactions = useAppSelector((state) => state.transactions.transactions)
    const investmentCursor = useAppSelector((state) => state.investments.cursor)
    const transactionCursor = useAppSelector((state) => state.transactions.cursor)
    const transactionsLoading = useAppSelector((state) => state.transactions.loading)
    const loadRecommendationsError = useAppSelector((state) => state.analysis.error)
    const loadingRecommendations = useAppSelector((state) => state.analysis.loading)
    const monthlySummaries = useAppSelector((state) => state.transactions.monthlySummaries)
    const loadingBalances = useAppSelector((state) => state.analysis.loadingProjections)
    const loadingProjectionError = useAppSelector((state) => state.analysis.loadingProjectionsError)
    const monthlySpendings = useAppSelector((state) => state.transactions.monthlySummaries)
    const netWorths = useAppSelector((state) => state.netWorthSlice.networths)
    const stockPrices = useAppSelector((state) => state.investments.stockPriceData)
    const defaultParams = useDefaultValuesForProjection({
        accounts: accounts ?? [],
        monthlySpendings: monthlySpendings ?? [],
        estimatedSavings: {} as any,
    })
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)
    const recommendations = useAppSelector((state) => state.analysis.fullPictureRecommendations)
    const institutions = useAppSelector((state) => state.idsSlice.institutions)
    const investmentMap = useAppSelector(selectInvestmentsMap)
    const topMovingStocks = useAppSelector(selectTopMovingStocks)
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
            dispatch(getYesterdaySummaryAsyncThunk({ client, append: false }))
            dispatch(getMonthlySummariesAsyncThunk({ client, append: false }))
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
        if (institutions?.length && loadAccounts && !accounts?.length) {
            try {
                callFunctionsForEachId(
                    (id: string) => dispatch(getAccountsAsync({ client, id: id || '' })),
                    institutions?.map((el) => el.item_id)
                )
            } catch (err) {
                logger.error('unable to get accounts', err)
            }
        }
    }, [loadAccounts, institutions?.length, accounts?.length])

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

    useEffect(() => {
        !netWorths?.length && dispatch(getNetworths({ id, client }))
    }, [netWorths?.length])

    useEffect(() => {
        const joinedData = Object.values(investmentMap ?? {})
        if (joinedData?.length && loadTopStockAnalysis) {
            console.info('calling get stock', investmentMap, joinedData)
            dispatch(getInvestmentStockPrices({ client, securities: joinedData.map((el) => el.security) }))
        }
    }, [investmentMap, loadTopStockAnalysis, getInvestmentStockPrices])

    useEffect(() => {
        if (topMovingStocks && loadTopStockAnalysis) {
            topMovingStocks.map((stock) => {
                dispatch(
                    getInvestmentAnalysis({
                        client,
                        security: Object.values(stock?.[1] ?? {})[0]?.security,
                        analysisType: AnalysisType.DAILY,
                    })
                )
            })
        }
    }, [topMovingStocks, loadTopStockAnalysis])

    // Trigger recommendations once everything else is loaded
    useEffect(() => {
        if (
            loadRecommendations &&
            accounts?.length &&
            !isTransactionsLoading() &&
            !isInvestmentsLoading() &&
            !loadRecommendationsError &&
            !loadingRecommendations &&
            !recommendations
        ) {
            dispatch(getFullPictureRecommendationAsync({ client }))
        }
    }, [
        accounts,
        isTransactionsLoading,
        isInvestmentsLoading,
        dispatch,
        id,
        loadRecommendations,
        loadRecommendationsError,
        loadingRecommendations,
        recommendations,
    ])

    useEffect(() => {
        if (
            accounts &&
            monthlySummaries &&
            defaultParams &&
            !projectedBalances &&
            !loadingBalances &&
            !loadingProjectionError &&
            loadProjection
        ) {
            dispatch(getFinancialProjection({ input: defaultParams, client }))
        }
    }, [defaultParams, monthlySummaries, accounts, projectedBalances, loadingBalances, loadingProjectionError])
    useEffect(() => {
        !institutions?.length && dispatch(getIdsAsync({ client }))
    }, [institutions])
    return {
        accounts,
        investments,
        transactions,
        isTransactionsLoading,
        isInvestmentsLoading,
    }
}
