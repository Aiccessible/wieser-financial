/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getItems = /* GraphQL */ `query GetItems($limit: Int, $cursor: String) {
  getItems(limit: $limit, cursor: $cursor) {
    cursor
    items {
      item_id
      institution_id
      institution_name
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
export const getFinancialRecommendations = /* GraphQL */ `query GetFinancialRecommendations($chat: ChatQuery) {
  getFinancialRecommendations(chat: $chat) {
    explanation
    action {
      transfers {
        fromAccountName
        toAccountName
        amount
        __typename
      }
      description
      __typename
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
