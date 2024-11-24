/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const retryCodeBuild = /* GraphQL */ `query RetryCodeBuild($build: RetryCodeBuildInput) {
  retryCodeBuild(build: $build)
}
` as GeneratedQuery<
  APITypes.RetryCodeBuildQueryVariables,
  APITypes.RetryCodeBuildQuery
>;
export const getUserAnalysis = /* GraphQL */ `query GetUserAnalysis {
  getUserAnalysis {
    analysisName
    s3Key
    currentDescription
    currentProjection
    currentInputs
    titles
    descriptions
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetUserAnalysisQueryVariables,
  APITypes.GetUserAnalysisQuery
>;
export const getUserAnalysisFields = /* GraphQL */ `query GetUserAnalysisFields {
  getUserAnalysisFields {
    inputName
    inputValue
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetUserAnalysisFieldsQueryVariables,
  APITypes.GetUserAnalysisFieldsQuery
>;
export const getItems = /* GraphQL */ `query GetItems($limit: Int, $cursor: String) {
  getItems(limit: $limit, cursor: $cursor) {
    cursor
    items {
      item_id
      institution_id
      institution_name
      sk
      created_at
      pk
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<APITypes.GetItemsQueryVariables, APITypes.GetItemsQuery>;
export const getAccounts = /* GraphQL */ `query GetAccounts($id: ID!) {
  getAccounts(id: $id) {
    account_id
    type
    name
    subtype
    balances {
      current
      iso_currency_code
      available
      limit
      __typename
    }
    mask
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAccountsQueryVariables,
  APITypes.GetAccountsQuery
>;
export const getTransactions = /* GraphQL */ `query GetTransactions($id: ID!, $limit: Int, $cursor: String) {
  getTransactions(id: $id, limit: $limit, cursor: $cursor) {
    cursor
    transactions {
      transaction_id
      account_id
      amount
      name
      iso_currency_code
      date
      payment_channel
      transaction_type
      personal_finance_category {
        detailed
        confidence_level
        primary
        __typename
      }
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTransactionsQueryVariables,
  APITypes.GetTransactionsQuery
>;
export const getInvestments = /* GraphQL */ `query GetInvestments($id: ID!, $limit: Int, $cursor: String) {
  getInvestments(id: $id, limit: $limit, cursor: $cursor) {
    cursor
    transactions {
      ... on Holding {
        account_id
        cost_basis
        institution_price
        institution_price_as_of
        institution_price_datetime
        institution_value
        iso_currency_code
        quantity
        security_id
        unofficial_currency_code
        plaid_type
      }
      ... on Security {
        close_price
        account_id
        close_price_as_of
        cost_basis
        cusip
        institution_id
        institution_security_id
        is_cash_equivalent
        isin
        iso_currency_code
        name
        proxy_security_id
        security_id
        sedol
        ticker_symbol
        type
        unofficial_currency_code
        update_datetime
        market_identifier_code
        sector
        industry
        option_contract
        plaid_type
      }
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetInvestmentsQueryVariables,
  APITypes.GetInvestmentsQuery
>;
export const getBudgets = /* GraphQL */ `query GetBudgets($id: ID!, $limit: Int, $cursor: String) {
  getBudgets(id: $id, limit: $limit, cursor: $cursor) {
    cursor
    budgets {
      pk
      sk
      highLevelCategory
      timeframe
      spendingThreshold
      createdAt
      specificPayeeRegex
      recommendationTitle
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBudgetsQueryVariables,
  APITypes.GetBudgetsQuery
>;
export const getFinancialSimulationExpansion = /* GraphQL */ `query GetFinancialSimulationExpansion($chat: ExpandFinancialSimulation) {
  getFinancialSimulationExpansion(chat: $chat) {
    s3Key
    newInputs
    description
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFinancialSimulationExpansionQueryVariables,
  APITypes.GetFinancialSimulationExpansionQuery
>;
export const getFinancialRecommendations = /* GraphQL */ `query GetFinancialRecommendations($chat: ChatQuery) {
  getFinancialRecommendations(chat: $chat) {
    explanation
    action {
      ... on RecommendationAction {
        transfers {
          fromAccountName
          toAccountName
          amount
          __typename
        }
        description
      }
      ... on TransactionRecommendationAction {
        budget {
          pk
          sk
          highLevelCategory
          timeframe
          spendingThreshold
          createdAt
          specificPayeeRegex
          recommendationTitle
          __typename
        }
        description
      }
    }
    title
    priority
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFinancialRecommendationsQueryVariables,
  APITypes.GetFinancialRecommendationsQuery
>;
export const getFinancialConversationResponse = /* GraphQL */ `query GetFinancialConversationResponse($chat: ChatQuery) {
  getFinancialConversationResponse(chat: $chat) {
    response
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFinancialConversationResponseQueryVariables,
  APITypes.GetFinancialConversationResponseQuery
>;
export const getSpendingSummary = /* GraphQL */ `query GetSpendingSummary(
  $minDate: Long
  $maxDate: Long
  $id: String!
  $type: SpendingSummaryType
) {
  getSpendingSummary(
    minDate: $minDate
    maxDate: $maxDate
    id: $id
    type: $type
  ) {
    sk
    spending
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSpendingSummaryQueryVariables,
  APITypes.GetSpendingSummaryQuery
>;
export const getNetWorths = /* GraphQL */ `query GetNetWorths(
  $minDate: String
  $maxDate: String
  $id: String!
  $type: NetWorthSummaryType
) {
  getNetWorths(minDate: $minDate, maxDate: $maxDate, id: $id, type: $type) {
    pk
    sk
    netWorth
    tfsaNetWorth
    rrspNetWorth
    fhsaNetWorth
    securityNetWorth
    balances
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetNetWorthsQueryVariables,
  APITypes.GetNetWorthsQuery
>;
