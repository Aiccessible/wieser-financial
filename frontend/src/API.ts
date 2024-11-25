/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type AnalysisInput = {
  analysisName: string,
  s3Key: string,
  currentDescription?: string | null,
  currentProjection?: string | null,
  currentInputs?: Array< string | null > | null,
  titles?: Array< string | null > | null,
  descriptions?: Array< string | null > | null,
};

export type Analysis = {
  __typename: "Analysis",
  analysisName: string,
  s3Key: string,
  currentDescription?: string | null,
  currentProjection?: string | null,
  currentInputs?: Array< string | null > | null,
  titles?: Array< string | null > | null,
  descriptions?: Array< string | null > | null,
};

export type AnalysisFieldInput = {
  inputName: string,
  inputValue: string,
};

export type AnalysisField = {
  __typename: "AnalysisField",
  inputName: string,
  inputValue: string,
};

export type ChatInput = {
  pk?: string | null,
  sk?: string | null,
  message?: string | null,
  time?: string | null,
  isLastChunk?: boolean | null,
  messageId?: string | null,
  expire_at?: string | null,
};

export type Chat = {
  __typename: "Chat",
  pk?: string | null,
  sk?: string | null,
  message?: string | null,
  time?: string | null,
  isLastChunk?: boolean | null,
  messageId?: string | null,
};

export type BudgetPlanInput = {
  pk?: string | null,
  sk?: string | null,
  highLevelCategory?: HighLevelTransactionCategory | null,
  timeframe?: BudgetTimeframe | null,
  spendingThreshold?: number | null,
  createdAt?: string | null,
  specificPayeeRegex?: string | null,
  recommendationTitle?: string | null,
};

export enum HighLevelTransactionCategory {
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
  RENT_AND_UTILITIES_OTHER_UTILITIES = "RENT_AND_UTILITIES_OTHER_UTILITIES",
}


export enum BudgetTimeframe {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}


export type BudgetPlan = {
  __typename: "BudgetPlan",
  pk?: string | null,
  sk?: string | null,
  highLevelCategory?: HighLevelTransactionCategory | null,
  timeframe?: BudgetTimeframe | null,
  spendingThreshold?: number | null,
  createdAt?: string | null,
  specificPayeeRegex?: string | null,
  recommendationTitle?: string | null,
};

export type RetryCodeBuildInput = {
  error?: string | null,
  s3Key?: string | null,
};

export type PaginatedItems = {
  __typename: "PaginatedItems",
  cursor?: string | null,
  items:  Array<Item >,
};

export type Item = {
  __typename: "Item",
  item_id: string,
  institution_id: string,
  institution_name: string,
  sk?: string | null,
  created_at?: string | null,
  pk?: string | null,
};

export type Account = {
  __typename: "Account",
  account_id: string,
  type?: string | null,
  name?: string | null,
  subtype?: string | null,
  balances?: Balances | null,
  mask?: string | null,
};

export type Balances = {
  __typename: "Balances",
  current?: string | null,
  iso_currency_code?: string | null,
  available?: string | null,
  limit?: string | null,
};

export type PaginatedTransactions = {
  __typename: "PaginatedTransactions",
  cursor?: string | null,
  transactions:  Array<Transaction >,
};

export type Transaction = {
  __typename: "Transaction",
  transaction_id: string,
  account_id?: string | null,
  amount?: string | null,
  name?: string | null,
  iso_currency_code?: string | null,
  date?: string | null,
  payment_channel?: string | null,
  transaction_type?: string | null,
  personal_finance_category?: PersonalFinanceCategory | null,
};

export type PersonalFinanceCategory = {
  __typename: "PersonalFinanceCategory",
  detailed?: string | null,
  confidence_level?: string | null,
  primary?: HighLevelTransactionCategory | null,
};

export type PaginatedInvestments = {
  __typename: "PaginatedInvestments",
  cursor?: string | null,
  transactions:  Array<Investment >,
};

export type Investment = Holding | Security


export type Holding = {
  __typename: "Holding",
  account_id?: string | null,
  cost_basis?: number | null,
  institution_price?: number | null,
  institution_price_as_of?: string | null,
  institution_price_datetime?: string | null,
  institution_value?: number | null,
  iso_currency_code?: string | null,
  quantity?: number | null,
  security_id?: string | null,
  unofficial_currency_code?: string | null,
  plaid_type?: string | null,
};

export type Security = {
  __typename: "Security",
  close_price?: number | null,
  account_id?: string | null,
  close_price_as_of?: string | null,
  cost_basis?: number | null,
  cusip?: string | null,
  institution_id?: string | null,
  institution_security_id?: string | null,
  is_cash_equivalent?: boolean | null,
  isin?: string | null,
  iso_currency_code?: string | null,
  name?: string | null,
  proxy_security_id?: string | null,
  security_id?: string | null,
  sedol?: string | null,
  ticker_symbol?: string | null,
  type?: string | null,
  unofficial_currency_code?: string | null,
  update_datetime?: string | null,
  market_identifier_code?: string | null,
  sector?: string | null,
  industry?: string | null,
  option_contract?: string | null,
  plaid_type?: string | null,
};

export type PaginatedBudgets = {
  __typename: "PaginatedBudgets",
  cursor?: string | null,
  budgets?:  Array<BudgetPlan | null > | null,
};

export type ExpandFinancialSimulation = {
  message?: string | null,
  s3Key?: string | null,
};

export type FinancialSimulationExpansion = {
  __typename: "FinancialSimulationExpansion",
  s3Key?: string | null,
  newInputs?: Array< string | null > | null,
  description?: string | null,
};

export type ChatQuery = {
  prompt?: string | null,
  chatHistory?: ChatHistory | null,
  chatFocus?: ChatFocus | null,
  accountIds?: Array< string > | null,
  requiresLiveData?: boolean | null,
  doNotUseAdvancedRag?: boolean | null,
  shouldRagFetch?: boolean | null,
  chatType?: ChatType | null,
  highLevelCategory?: HighLevelTransactionCategory | null,
  currentDateRange?: Array< string | null > | null,
  cacheIdentifiers?: Array< CacheIdentifer > | null,
};

export type ChatHistory = {
  message?: string | null,
  role?: Role | null,
};

export enum Role {
  Assistant = "Assistant",
  User = "User",
}


export enum ChatFocus {
  All = "All",
  Investment = "Investment",
  Transaction = "Transaction",
  Accounts = "Accounts",
  Tax = "Tax",
}


export enum ChatType {
  Regular = "Regular",
  FinancialNewsQuery = "FinancialNewsQuery",
  FinancialAnalysisQuery = "FinancialAnalysisQuery",
  TransactionRecommendation = "TransactionRecommendation",
  GeneralRecommendation = "GeneralRecommendation",
  SimulationExpansion = "SimulationExpansion",
  SimulationPreExpansion = "SimulationPreExpansion",
  RetryCodeBuild = "RetryCodeBuild",
}


export type CacheIdentifer = {
  key?: string | null,
  cacheType?: CacheType | null,
};

export enum CacheType {
  StockNews = "StockNews",
  StockAnalysis = "StockAnalysis",
  InvestmentAnalysis = "InvestmentAnalysis",
  PortfolioAnalysis = "PortfolioAnalysis",
  TransactionRecommendation = "TransactionRecommendation",
  GeneralRecommendation = "GeneralRecommendation",
}


export type Recommendation = {
  __typename: "Recommendation",
  explanation?: string | null,
  action?: Action | null,
  title?: string | null,
  priority?: string | null,
};

export type Action = RecommendationAction | TransactionRecommendationAction


export type RecommendationAction = {
  __typename: "RecommendationAction",
  transfers?:  Array<Transfer | null > | null,
  description?: string | null,
};

export type Transfer = {
  __typename: "Transfer",
  fromAccountName?: string | null,
  toAccountName?: string | null,
  amount?: string | null,
};

export type TransactionRecommendationAction = {
  __typename: "TransactionRecommendationAction",
  budget?:  Array<BudgetPlan | null > | null,
  description?: string | null,
};

export type ChatResponse = {
  __typename: "ChatResponse",
  response?: string | null,
};

export enum SpendingSummaryType {
  MONTHLYSUMMARY = "MONTHLYSUMMARY",
  DAILYSUMMARY = "DAILYSUMMARY",
}


export type SpendingSummary = {
  __typename: "SpendingSummary",
  sk?: string | null,
  // Date in string format (e.g., "YYYY-MM-DD")
  spending?: string | null,
};

export enum NetWorthSummaryType {
  NETWORTHDAILYSNAPSHOT = "NETWORTHDAILYSNAPSHOT",
  NETWORTHWEEKLYSNAPSHOT = "NETWORTHWEEKLYSNAPSHOT",
  NETWORTHMONTHLYSNAPSHOT = "NETWORTHMONTHLYSNAPSHOT",
}


export type NetWorth = {
  __typename: "NetWorth",
  pk?: string | null,
  sk?: string | null,
  netWorth?: string | null,
  tfsaNetWorth?: string | null,
  rrspNetWorth?: string | null,
  fhsaNetWorth?: string | null,
  securityNetWorth?: string | null,
  balances?: string | null,
};

export type CreateAnalysisMutationVariables = {
  analysis?: AnalysisInput | null,
};

export type CreateAnalysisMutation = {
  createAnalysis?:  {
    __typename: "Analysis",
    analysisName: string,
    s3Key: string,
    currentDescription?: string | null,
    currentProjection?: string | null,
    currentInputs?: Array< string | null > | null,
    titles?: Array< string | null > | null,
    descriptions?: Array< string | null > | null,
  } | null,
};

export type CreateAnalysisFieldMutationVariables = {
  analysisField?: AnalysisFieldInput | null,
};

export type CreateAnalysisFieldMutation = {
  createAnalysisField?:  {
    __typename: "AnalysisField",
    inputName: string,
    inputValue: string,
  } | null,
};

export type CreateChatMutationVariables = {
  chat: ChatInput,
};

export type CreateChatMutation = {
  createChat?:  {
    __typename: "Chat",
    pk?: string | null,
    sk?: string | null,
    message?: string | null,
    time?: string | null,
    isLastChunk?: boolean | null,
    messageId?: string | null,
  } | null,
};

export type CreateBudgetMutationVariables = {
  budget: BudgetPlanInput,
};

export type CreateBudgetMutation = {
  createBudget?:  {
    __typename: "BudgetPlan",
    pk?: string | null,
    sk?: string | null,
    highLevelCategory?: HighLevelTransactionCategory | null,
    timeframe?: BudgetTimeframe | null,
    spendingThreshold?: number | null,
    createdAt?: string | null,
    specificPayeeRegex?: string | null,
    recommendationTitle?: string | null,
  } | null,
};

export type RetryCodeBuildQueryVariables = {
  build?: RetryCodeBuildInput | null,
};

export type RetryCodeBuildQuery = {
  retryCodeBuild?: string | null,
};

export type GetUserAnalysisQueryVariables = {
};

export type GetUserAnalysisQuery = {
  getUserAnalysis:  Array< {
    __typename: "Analysis",
    analysisName: string,
    s3Key: string,
    currentDescription?: string | null,
    currentProjection?: string | null,
    currentInputs?: Array< string | null > | null,
    titles?: Array< string | null > | null,
    descriptions?: Array< string | null > | null,
  } | null >,
};

export type GetUserAnalysisFieldsQueryVariables = {
};

export type GetUserAnalysisFieldsQuery = {
  getUserAnalysisFields:  Array< {
    __typename: "AnalysisField",
    inputName: string,
    inputValue: string,
  } | null >,
};

export type GetItemsQueryVariables = {
  limit?: number | null,
  cursor?: string | null,
};

export type GetItemsQuery = {
  getItems:  {
    __typename: "PaginatedItems",
    cursor?: string | null,
    items:  Array< {
      __typename: "Item",
      item_id: string,
      institution_id: string,
      institution_name: string,
      sk?: string | null,
      created_at?: string | null,
      pk?: string | null,
    } >,
  },
};

export type GetAccountsQueryVariables = {
  id: string,
};

export type GetAccountsQuery = {
  getAccounts:  Array< {
    __typename: "Account",
    account_id: string,
    type?: string | null,
    name?: string | null,
    subtype?: string | null,
    balances?:  {
      __typename: "Balances",
      current?: string | null,
      iso_currency_code?: string | null,
      available?: string | null,
      limit?: string | null,
    } | null,
    mask?: string | null,
  } >,
};

export type GetTransactionsQueryVariables = {
  id: string,
  limit?: number | null,
  cursor?: string | null,
  personalFinanceCategory?: Array< string | null > | null,
  personalFinanceKey?: string | null,
  minDate?: string | null,
  maxDate?: string | null,
};

export type GetTransactionsQuery = {
  getTransactions:  {
    __typename: "PaginatedTransactions",
    cursor?: string | null,
    transactions:  Array< {
      __typename: "Transaction",
      transaction_id: string,
      account_id?: string | null,
      amount?: string | null,
      name?: string | null,
      iso_currency_code?: string | null,
      date?: string | null,
      payment_channel?: string | null,
      transaction_type?: string | null,
      personal_finance_category?:  {
        __typename: "PersonalFinanceCategory",
        detailed?: string | null,
        confidence_level?: string | null,
        primary?: HighLevelTransactionCategory | null,
      } | null,
    } >,
  },
};

export type GetInvestmentsQueryVariables = {
  id: string,
  limit?: number | null,
  cursor?: string | null,
};

export type GetInvestmentsQuery = {
  getInvestments:  {
    __typename: "PaginatedInvestments",
    cursor?: string | null,
    transactions:  Array<( {
        __typename: "Holding",
        account_id?: string | null,
        cost_basis?: number | null,
        institution_price?: number | null,
        institution_price_as_of?: string | null,
        institution_price_datetime?: string | null,
        institution_value?: number | null,
        iso_currency_code?: string | null,
        quantity?: number | null,
        security_id?: string | null,
        unofficial_currency_code?: string | null,
        plaid_type?: string | null,
      } | {
        __typename: "Security",
        close_price?: number | null,
        account_id?: string | null,
        close_price_as_of?: string | null,
        cost_basis?: number | null,
        cusip?: string | null,
        institution_id?: string | null,
        institution_security_id?: string | null,
        is_cash_equivalent?: boolean | null,
        isin?: string | null,
        iso_currency_code?: string | null,
        name?: string | null,
        proxy_security_id?: string | null,
        security_id?: string | null,
        sedol?: string | null,
        ticker_symbol?: string | null,
        type?: string | null,
        unofficial_currency_code?: string | null,
        update_datetime?: string | null,
        market_identifier_code?: string | null,
        sector?: string | null,
        industry?: string | null,
        option_contract?: string | null,
        plaid_type?: string | null,
      }
    ) >,
  },
};

export type GetBudgetsQueryVariables = {
  id: string,
  limit?: number | null,
  cursor?: string | null,
};

export type GetBudgetsQuery = {
  getBudgets:  {
    __typename: "PaginatedBudgets",
    cursor?: string | null,
    budgets?:  Array< {
      __typename: "BudgetPlan",
      pk?: string | null,
      sk?: string | null,
      highLevelCategory?: HighLevelTransactionCategory | null,
      timeframe?: BudgetTimeframe | null,
      spendingThreshold?: number | null,
      createdAt?: string | null,
      specificPayeeRegex?: string | null,
      recommendationTitle?: string | null,
    } | null > | null,
  },
};

export type GetFinancialSimulationExpansionQueryVariables = {
  chat?: ExpandFinancialSimulation | null,
};

export type GetFinancialSimulationExpansionQuery = {
  getFinancialSimulationExpansion:  {
    __typename: "FinancialSimulationExpansion",
    s3Key?: string | null,
    newInputs?: Array< string | null > | null,
    description?: string | null,
  },
};

export type GetFinancialRecommendationsQueryVariables = {
  chat?: ChatQuery | null,
};

export type GetFinancialRecommendationsQuery = {
  getFinancialRecommendations:  Array< {
    __typename: "Recommendation",
    explanation?: string | null,
    action: ( {
        __typename: "RecommendationAction",
        transfers?:  Array< {
          __typename: string,
          fromAccountName?: string | null,
          toAccountName?: string | null,
          amount?: string | null,
        } | null > | null,
        description?: string | null,
      } | {
        __typename: "TransactionRecommendationAction",
        budget?:  Array< {
          __typename: string,
          pk?: string | null,
          sk?: string | null,
          highLevelCategory?: HighLevelTransactionCategory | null,
          timeframe?: BudgetTimeframe | null,
          spendingThreshold?: number | null,
          createdAt?: string | null,
          specificPayeeRegex?: string | null,
          recommendationTitle?: string | null,
        } | null > | null,
        description?: string | null,
      }
    ) | null,
    title?: string | null,
    priority?: string | null,
  } | null >,
};

export type GetFinancialConversationResponseQueryVariables = {
  chat?: ChatQuery | null,
};

export type GetFinancialConversationResponseQuery = {
  getFinancialConversationResponse:  {
    __typename: "ChatResponse",
    response?: string | null,
  },
};

export type GetSpendingSummaryQueryVariables = {
  minDate?: string | null,
  maxDate?: string | null,
  id: string,
  type?: SpendingSummaryType | null,
};

export type GetSpendingSummaryQuery = {
  getSpendingSummary?:  {
    __typename: "SpendingSummary",
    sk?: string | null,
    // Date in string format (e.g., "YYYY-MM-DD")
    spending?: string | null,
  } | null,
};

export type GetNetWorthsQueryVariables = {
  minDate?: string | null,
  maxDate?: string | null,
  id: string,
  type?: NetWorthSummaryType | null,
};

export type GetNetWorthsQuery = {
  getNetWorths?:  Array< {
    __typename: "NetWorth",
    pk?: string | null,
    sk?: string | null,
    netWorth?: string | null,
    tfsaNetWorth?: string | null,
    rrspNetWorth?: string | null,
    fhsaNetWorth?: string | null,
    securityNetWorth?: string | null,
    balances?: string | null,
  } | null > | null,
};

export type OnCreateChatSubscriptionVariables = {
  pk: string,
};

export type OnCreateChatSubscription = {
  onCreateChat?:  {
    __typename: "Chat",
    pk?: string | null,
    sk?: string | null,
    message?: string | null,
    time?: string | null,
    isLastChunk?: boolean | null,
    messageId?: string | null,
  } | null,
};
