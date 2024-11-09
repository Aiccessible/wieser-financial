export type ChatInput = {
    pk?: string | null;
    sk?: string | null;
    message?: string | null;
    time?: string | null;
    isLastChunk?: boolean | null;
    messageId?: string | null;
};
export type Chat = {
    __typename: "Chat";
    pk?: string | null;
    sk?: string | null;
    message?: string | null;
    time?: string | null;
    isLastChunk?: boolean | null;
    messageId?: string | null;
};
export type PaginatedItems = {
    __typename: "PaginatedItems";
    cursor?: string | null;
    items: Array<Item>;
};
export type Item = {
    __typename: "Item";
    item_id: string;
    institution_id: string;
    institution_name: string;
    sk?: string | null;
    created_at?: string | null;
    pk?: string | null;
};
export type Account = {
    __typename: "Account";
    account_id: string;
    type?: string | null;
    name?: string | null;
    subtype?: string | null;
    balances?: Balances | null;
    mask?: string | null;
};
export type Balances = {
    __typename: "Balances";
    current?: string | null;
    iso_currency_code?: string | null;
    available?: string | null;
    limit?: string | null;
};
export type PaginatedTransactions = {
    __typename: "PaginatedTransactions";
    cursor?: string | null;
    transactions: Array<Transaction>;
};
export type Transaction = {
    __typename: "Transaction";
    transaction_id: string;
    account_id?: string | null;
    amount?: string | null;
    name?: string | null;
    iso_currency_code?: string | null;
    date?: string | null;
    payment_channel?: string | null;
    transaction_type?: string | null;
    personal_finance_category?: PersonalFinanceCategory | null;
};
export type PersonalFinanceCategory = {
    __typename: "PersonalFinanceCategory";
    detailed?: string | null;
    confidence_level?: string | null;
    primary?: HighLevelTransactionCategory | null;
};
export declare enum HighLevelTransactionCategory {
    LOAN_PAYMENTS = "LOAN_PAYMENTS",
    BANK_FEES = "BANK_FEES",
    ENTERTAINMENT = "ENTERTAINMENT",
    FOOD_AND_DRINK = "FOOD_AND_DRINK",
    GENERAL_MERCHANDISE = "GENERAL_MERCHANDISE",
    HOME_IMPROVEMENT = "HOME_IMPROVEMENT",
    MEDICAL = "MEDICAL",
    PERSONAL_CARE = "PERSONAL_CARE",
    GENERAL_SERVICES = "GENERAL_SERVICES",
    GOVERNMENT_AND_NON_PROFIT = "GOVERNMENT_AND_NON_PROFIT",
    TRANSPORTATION = "TRANSPORTATION",
    TRAVEL = "TRAVEL",
    INCOME = "INCOME",
    TRANSFER_IN = "TRANSFER_IN",
    INCOME_WAGES = "INCOME_WAGES",
    TRANSFER_OUT = "TRANSFER_OUT",
    RENT_AND_UTILITIES = "RENT_AND_UTILITIES",
    INCOME_OTHER_INCOME = "INCOME_OTHER_INCOME",
    INCOME_UNEMPLOYMENT = "INCOME_UNEMPLOYMENT",
    INCOME_TAX_REFUND = "INCOME_TAX_REFUND",
    INCOME_RETIREMENT_PENSION = "INCOME_RETIREMENT_PENSION",
    INCOME_INTEREST_EARNED = "INCOME_INTEREST_EARNED",
    INCOME_DIVIDENDS = "INCOME_DIVIDENDS",
    TRANSFER_IN_CASH_ADVANCES_AND_LOANS = "TRANSFER_IN_CASH_ADVANCES_AND_LOANS",
    TRANSFER_IN_DEPOSIT = "TRANSFER_IN_DEPOSIT",
    TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS = "TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS",
    TRANSFER_IN_SAVINGS = "TRANSFER_IN_SAVINGS",
    TRANSFER_IN_ACCOUNT_TRANSFER = "TRANSFER_IN_ACCOUNT_TRANSFER",
    TRANSFER_IN_OTHER_TRANSFER_IN = "TRANSFER_IN_OTHER_TRANSFER_IN",
    TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS = "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS",
    TRANSFER_OUT_SAVINGS = "TRANSFER_OUT_SAVINGS",
    TRANSFER_OUT_WITHDRAWAL = "TRANSFER_OUT_WITHDRAWAL",
    TRANSFER_OUT_ACCOUNT_TRANSFER = "TRANSFER_OUT_ACCOUNT_TRANSFER",
    TRANSFER_OUT_OTHER_TRANSFER_OUT = "TRANSFER_OUT_OTHER_TRANSFER_OUT",
    LOAN_PAYMENTS_CAR_PAYMENT = "LOAN_PAYMENTS_CAR_PAYMENT",
    LOAN_PAYMENTS_CREDIT_CARD_PAYMENT = "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
    LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT = "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT",
    LOAN_PAYMENTS_MORTGAGE_PAYMENT = "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
    LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT = "LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT",
    LOAN_PAYMENTS_OTHER_PAYMENT = "LOAN_PAYMENTS_OTHER_PAYMENT",
    RENT_AND_UTILITIES_GAS_AND_ELECTRICITY = "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
    RENT_AND_UTILITIES_INTERNET_AND_CABLE = "RENT_AND_UTILITIES_INTERNET_AND_CABLE",
    RENT_AND_UTILITIES_RENT = "RENT_AND_UTILITIES_RENT",
    RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT = "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT",
    RENT_AND_UTILITIES_TELEPHONE = "RENT_AND_UTILITIES_TELEPHONE",
    RENT_AND_UTILITIES_WATER = "RENT_AND_UTILITIES_WATER",
    RENT_AND_UTILITIES_OTHER_UTILITIES = "RENT_AND_UTILITIES_OTHER_UTILITIES"
}
export type PaginatedInvestments = {
    __typename: "PaginatedInvestments";
    cursor?: string | null;
    transactions: Array<Investment>;
};
export type Investment = Holding | Security;
export type Holding = {
    __typename: "Holding";
    account_id?: string | null;
    cost_basis?: number | null;
    institution_price?: number | null;
    institution_price_as_of?: string | null;
    institution_price_datetime?: string | null;
    institution_value?: number | null;
    iso_currency_code?: string | null;
    quantity?: number | null;
    security_id?: string | null;
    unofficial_currency_code?: string | null;
    plaid_type?: string | null;
};
export type Security = {
    __typename: "Security";
    close_price?: number | null;
    account_id?: string | null;
    close_price_as_of?: string | null;
    cost_basis?: number | null;
    cusip?: string | null;
    institution_id?: string | null;
    institution_security_id?: string | null;
    is_cash_equivalent?: boolean | null;
    isin?: string | null;
    iso_currency_code?: string | null;
    name?: string | null;
    proxy_security_id?: string | null;
    security_id?: string | null;
    sedol?: string | null;
    ticker_symbol?: string | null;
    type?: string | null;
    unofficial_currency_code?: string | null;
    update_datetime?: string | null;
    market_identifier_code?: string | null;
    sector?: string | null;
    industry?: string | null;
    option_contract?: string | null;
    plaid_type?: string | null;
};
export type ChatQuery = {
    prompt?: string | null;
    chatFocus?: ChatFocus | null;
    accountIds?: Array<string> | null;
    requiresLiveData?: boolean | null;
    doNotUseAdvancedRag?: boolean | null;
    shouldRagFetch?: boolean | null;
    chatType?: ChatType | null;
    highLevelCategory?: HighLevelTransactionCategory | null;
    currentDateRange?: Array<string | null> | null;
    cacheIdentifiers?: Array<CacheIdentifer> | null;
};
export declare enum ChatFocus {
    All = "All",
    Investment = "Investment",
    Transaction = "Transaction",
    Accounts = "Accounts",
    Tax = "Tax"
}
export declare enum ChatType {
    Regular = "Regular",
    FinancialNewsQuery = "FinancialNewsQuery",
    FinancialAnalysisQuery = "FinancialAnalysisQuery",
    TransactionRecommendation = "TransactionRecommendation"
}
export type CacheIdentifer = {
    key?: string | null;
    cacheType?: CacheType | null;
};
export declare enum CacheType {
    StockNews = "StockNews",
    StockAnalysis = "StockAnalysis",
    InvestmentAnalysis = "InvestmentAnalysis",
    PortfolioAnalysis = "PortfolioAnalysis",
    TransactionRecommendation = "TransactionRecommendation"
}
export type Recommendation = {
    __typename: "Recommendation";
    explanation?: string | null;
    action?: RecommendationAction | null;
    title?: string | null;
    priority?: string | null;
};
export type RecommendationAction = {
    __typename: "RecommendationAction";
    transfers?: Array<Transfer | null> | null;
    description?: string | null;
};
export type Transfer = {
    __typename: "Transfer";
    fromAccountName?: string | null;
    toAccountName?: string | null;
    amount?: string | null;
};
export type ChatResponse = {
    __typename: "ChatResponse";
    response?: string | null;
};
export declare enum SpendingSummaryType {
    MONTHLYSUMMARY = "MONTHLYSUMMARY",
    DAILYSUMMARY = "DAILYSUMMARY"
}
export type SpendingSummary = {
    __typename: "SpendingSummary";
    sk?: string | null;
    spending?: string | null;
};
export declare enum NetWorthSummaryType {
    NETWORTHDAILYSNAPSHOT = "NETWORTHDAILYSNAPSHOT",
    NETWORTHWEEKLYSNAPSHOT = "NETWORTHWEEKLYSNAPSHOT",
    NETWORTHMONTHLYSNAPSHOT = "NETWORTHMONTHLYSNAPSHOT"
}
export type NetWorth = {
    __typename: "NetWorth";
    pk?: string | null;
    sk?: string | null;
    netWorth?: string | null;
    tfsaNetWorth?: string | null;
    rrspNetWorth?: string | null;
    fhsaNetWorth?: string | null;
    securityNetWorth?: string | null;
    balances?: string | null;
};
export type CreateChatMutationVariables = {
    chat: ChatInput;
};
export type CreateChatMutation = {
    createChat?: {
        __typename: "Chat";
        pk?: string | null;
        sk?: string | null;
        message?: string | null;
        time?: string | null;
        isLastChunk?: boolean | null;
        messageId?: string | null;
    } | null;
};
export type GetItemsQueryVariables = {
    limit?: number | null;
    cursor?: string | null;
};
export type GetItemsQuery = {
    getItems: {
        __typename: "PaginatedItems";
        cursor?: string | null;
        items: Array<{
            __typename: "Item";
            item_id: string;
            institution_id: string;
            institution_name: string;
            sk?: string | null;
            created_at?: string | null;
            pk?: string | null;
        }>;
    };
};
export type GetAccountsQueryVariables = {
    id: string;
};
export type GetAccountsQuery = {
    getAccounts: Array<{
        __typename: "Account";
        account_id: string;
        type?: string | null;
        name?: string | null;
        subtype?: string | null;
        balances?: {
            __typename: "Balances";
            current?: string | null;
            iso_currency_code?: string | null;
            available?: string | null;
            limit?: string | null;
        } | null;
        mask?: string | null;
    }>;
};
export type GetTransactionsQueryVariables = {
    id: string;
    limit?: number | null;
    cursor?: string | null;
};
export type GetTransactionsQuery = {
    getTransactions: {
        __typename: "PaginatedTransactions";
        cursor?: string | null;
        transactions: Array<{
            __typename: "Transaction";
            transaction_id: string;
            account_id?: string | null;
            amount?: string | null;
            name?: string | null;
            iso_currency_code?: string | null;
            date?: string | null;
            payment_channel?: string | null;
            transaction_type?: string | null;
            personal_finance_category?: {
                __typename: "PersonalFinanceCategory";
                detailed?: string | null;
                confidence_level?: string | null;
                primary?: HighLevelTransactionCategory | null;
            } | null;
        }>;
    };
};
export type GetInvestmentsQueryVariables = {
    id: string;
    limit?: number | null;
    cursor?: string | null;
};
export type GetInvestmentsQuery = {
    getInvestments: {
        __typename: "PaginatedInvestments";
        cursor?: string | null;
        transactions: Array<({
            __typename: "Holding";
            account_id?: string | null;
            cost_basis?: number | null;
            institution_price?: number | null;
            institution_price_as_of?: string | null;
            institution_price_datetime?: string | null;
            institution_value?: number | null;
            iso_currency_code?: string | null;
            quantity?: number | null;
            security_id?: string | null;
            unofficial_currency_code?: string | null;
            plaid_type?: string | null;
        } | {
            __typename: "Security";
            close_price?: number | null;
            account_id?: string | null;
            close_price_as_of?: string | null;
            cost_basis?: number | null;
            cusip?: string | null;
            institution_id?: string | null;
            institution_security_id?: string | null;
            is_cash_equivalent?: boolean | null;
            isin?: string | null;
            iso_currency_code?: string | null;
            name?: string | null;
            proxy_security_id?: string | null;
            security_id?: string | null;
            sedol?: string | null;
            ticker_symbol?: string | null;
            type?: string | null;
            unofficial_currency_code?: string | null;
            update_datetime?: string | null;
            market_identifier_code?: string | null;
            sector?: string | null;
            industry?: string | null;
            option_contract?: string | null;
            plaid_type?: string | null;
        })>;
    };
};
export type GetFinancialRecommendationsQueryVariables = {
    chat?: ChatQuery | null;
};
export type GetFinancialRecommendationsQuery = {
    getFinancialRecommendations: Array<{
        __typename: "Recommendation";
        explanation?: string | null;
        action?: {
            __typename: "RecommendationAction";
            transfers?: Array<{
                __typename: "Transfer";
                fromAccountName?: string | null;
                toAccountName?: string | null;
                amount?: string | null;
            } | null> | null;
            description?: string | null;
        } | null;
        title?: string | null;
        priority?: string | null;
    } | null>;
};
export type GetFinancialConversationResponseQueryVariables = {
    chat?: ChatQuery | null;
};
export type GetFinancialConversationResponseQuery = {
    getFinancialConversationResponse: {
        __typename: "ChatResponse";
        response?: string | null;
    };
};
export type GetSpendingSummaryQueryVariables = {
    minDate?: string | null;
    maxDate?: string | null;
    id: string;
    type?: SpendingSummaryType | null;
};
export type GetSpendingSummaryQuery = {
    getSpendingSummary?: {
        __typename: "SpendingSummary";
        sk?: string | null;
        spending?: string | null;
    } | null;
};
export type GetNetWorthsQueryVariables = {
    minDate?: string | null;
    maxDate?: string | null;
    id: string;
    type?: NetWorthSummaryType | null;
};
export type GetNetWorthsQuery = {
    getNetWorths?: Array<{
        __typename: "NetWorth";
        pk?: string | null;
        sk?: string | null;
        netWorth?: string | null;
        tfsaNetWorth?: string | null;
        rrspNetWorth?: string | null;
        fhsaNetWorth?: string | null;
        securityNetWorth?: string | null;
        balances?: string | null;
    } | null> | null;
};
export type OnCreateChatSubscriptionVariables = {
    pk: string;
};
export type OnCreateChatSubscription = {
    onCreateChat?: {
        __typename: "Chat";
        pk?: string | null;
        sk?: string | null;
        message?: string | null;
        time?: string | null;
        isLastChunk?: boolean | null;
        messageId?: string | null;
    } | null;
};
