"use strict";
/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetWorths = exports.getSpendingSummary = exports.getFinancialConversationResponse = exports.getFinancialRecommendations = exports.getFinancialSimulationExpansion = exports.getBudgets = exports.getInvestments = exports.getTransactions = exports.getAccounts = exports.getItems = exports.getUserAnalysisFields = exports.getUserAnalysis = exports.retryCodeBuild = void 0;
exports.retryCodeBuild = `query RetryCodeBuild($build: RetryCodeBuildInput) {
  retryCodeBuild(build: $build)
}
`;
exports.getUserAnalysis = `query GetUserAnalysis {
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
`;
exports.getUserAnalysisFields = `query GetUserAnalysisFields {
  getUserAnalysisFields {
    inputName
    inputValue
    __typename
  }
}
`;
exports.getItems = `query GetItems($limit: Int, $cursor: String) {
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
`;
exports.getAccounts = `query GetAccounts($id: ID!) {
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
`;
exports.getTransactions = `query GetTransactions($id: ID!, $limit: Int, $cursor: String) {
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
`;
exports.getInvestments = `query GetInvestments($id: ID!, $limit: Int, $cursor: String) {
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
`;
exports.getBudgets = `query GetBudgets($id: ID!, $limit: Int, $cursor: String) {
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
`;
exports.getFinancialSimulationExpansion = `query GetFinancialSimulationExpansion($chat: ExpandFinancialSimulation) {
  getFinancialSimulationExpansion(chat: $chat) {
    s3Key
    newInputs
    description
    __typename
  }
}
`;
exports.getFinancialRecommendations = `query GetFinancialRecommendations($chat: ChatQuery) {
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
`;
exports.getFinancialConversationResponse = `query GetFinancialConversationResponse($chat: ChatQuery) {
  getFinancialConversationResponse(chat: $chat) {
    response
    __typename
  }
}
`;
exports.getSpendingSummary = `query GetSpendingSummary(
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
`;
exports.getNetWorths = `query GetNetWorths(
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
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxjQUFjLEdBQWlCOzs7Q0FNM0MsQ0FBQztBQUNXLFFBQUEsZUFBZSxHQUFpQjs7Ozs7Ozs7Ozs7O0NBZTVDLENBQUM7QUFDVyxRQUFBLHFCQUFxQixHQUFpQjs7Ozs7OztDQVVsRCxDQUFDO0FBQ1csUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Q0Flc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDO0FBQ1csUUFBQSxlQUFlLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCNUMsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlEM0MsQ0FBQztBQUNXLFFBQUEsVUFBVSxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQnZDLENBQUM7QUFDVyxRQUFBLCtCQUErQixHQUFpQjs7Ozs7Ozs7Q0FXNUQsQ0FBQztBQUNXLFFBQUEsMkJBQTJCLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQ3hELENBQUM7QUFDVyxRQUFBLGdDQUFnQyxHQUFpQjs7Ozs7O0NBUzdELENBQUM7QUFDVyxRQUFBLGtCQUFrQixHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQi9DLENBQUM7QUFDVyxRQUFBLFlBQVksR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlICovXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gdGhpcyBpcyBhbiBhdXRvIGdlbmVyYXRlZCBmaWxlLiBUaGlzIHdpbGwgYmUgb3ZlcndyaXR0ZW5cblxuaW1wb3J0ICogYXMgQVBJVHlwZXMgZnJvbSBcIi4uL0FQSVwiO1xudHlwZSBHZW5lcmF0ZWRRdWVyeTxJbnB1dFR5cGUsIE91dHB1dFR5cGU+ID0gc3RyaW5nICYge1xuICBfX2dlbmVyYXRlZFF1ZXJ5SW5wdXQ6IElucHV0VHlwZTtcbiAgX19nZW5lcmF0ZWRRdWVyeU91dHB1dDogT3V0cHV0VHlwZTtcbn07XG5cbmV4cG9ydCBjb25zdCByZXRyeUNvZGVCdWlsZCA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IFJldHJ5Q29kZUJ1aWxkKCRidWlsZDogUmV0cnlDb2RlQnVpbGRJbnB1dCkge1xuICByZXRyeUNvZGVCdWlsZChidWlsZDogJGJ1aWxkKVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuUmV0cnlDb2RlQnVpbGRRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuUmV0cnlDb2RlQnVpbGRRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRVc2VyQW5hbHlzaXMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRVc2VyQW5hbHlzaXMge1xuICBnZXRVc2VyQW5hbHlzaXMge1xuICAgIGFuYWx5c2lzTmFtZVxuICAgIHMzS2V5XG4gICAgY3VycmVudERlc2NyaXB0aW9uXG4gICAgY3VycmVudFByb2plY3Rpb25cbiAgICBjdXJyZW50SW5wdXRzXG4gICAgdGl0bGVzXG4gICAgZGVzY3JpcHRpb25zXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRVc2VyQW5hbHlzaXNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0VXNlckFuYWx5c2lzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0VXNlckFuYWx5c2lzRmllbGRzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0VXNlckFuYWx5c2lzRmllbGRzIHtcbiAgZ2V0VXNlckFuYWx5c2lzRmllbGRzIHtcbiAgICBpbnB1dE5hbWVcbiAgICBpbnB1dFZhbHVlXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRVc2VyQW5hbHlzaXNGaWVsZHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0VXNlckFuYWx5c2lzRmllbGRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0SXRlbXMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRJdGVtcygkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEl0ZW1zKGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIGl0ZW1zIHtcbiAgICAgIGl0ZW1faWRcbiAgICAgIGluc3RpdHV0aW9uX2lkXG4gICAgICBpbnN0aXR1dGlvbl9uYW1lXG4gICAgICBza1xuICAgICAgY3JlYXRlZF9hdFxuICAgICAgcGtcbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PEFQSVR5cGVzLkdldEl0ZW1zUXVlcnlWYXJpYWJsZXMsIEFQSVR5cGVzLkdldEl0ZW1zUXVlcnk+O1xuZXhwb3J0IGNvbnN0IGdldEFjY291bnRzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0QWNjb3VudHMoJGlkOiBJRCEpIHtcbiAgZ2V0QWNjb3VudHMoaWQ6ICRpZCkge1xuICAgIGFjY291bnRfaWRcbiAgICB0eXBlXG4gICAgbmFtZVxuICAgIHN1YnR5cGVcbiAgICBiYWxhbmNlcyB7XG4gICAgICBjdXJyZW50XG4gICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgYXZhaWxhYmxlXG4gICAgICBsaW1pdFxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBtYXNrXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRBY2NvdW50c1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRBY2NvdW50c1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldFRyYW5zYWN0aW9ucyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldFRyYW5zYWN0aW9ucygkaWQ6IElEISwgJGxpbWl0OiBJbnQsICRjdXJzb3I6IFN0cmluZykge1xuICBnZXRUcmFuc2FjdGlvbnMoaWQ6ICRpZCwgbGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgdHJhbnNhY3Rpb25zIHtcbiAgICAgIHRyYW5zYWN0aW9uX2lkXG4gICAgICBhY2NvdW50X2lkXG4gICAgICBhbW91bnRcbiAgICAgIG5hbWVcbiAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICBkYXRlXG4gICAgICBwYXltZW50X2NoYW5uZWxcbiAgICAgIHRyYW5zYWN0aW9uX3R5cGVcbiAgICAgIHBlcnNvbmFsX2ZpbmFuY2VfY2F0ZWdvcnkge1xuICAgICAgICBkZXRhaWxlZFxuICAgICAgICBjb25maWRlbmNlX2xldmVsXG4gICAgICAgIHByaW1hcnlcbiAgICAgICAgX190eXBlbmFtZVxuICAgICAgfVxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldFRyYW5zYWN0aW9uc1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRUcmFuc2FjdGlvbnNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRJbnZlc3RtZW50cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEludmVzdG1lbnRzKCRpZDogSUQhLCAkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEludmVzdG1lbnRzKGlkOiAkaWQsIGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIHRyYW5zYWN0aW9ucyB7XG4gICAgICAuLi4gb24gSG9sZGluZyB7XG4gICAgICAgIGFjY291bnRfaWRcbiAgICAgICAgY29zdF9iYXNpc1xuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZVxuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZV9hc19vZlxuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZV9kYXRldGltZVxuICAgICAgICBpbnN0aXR1dGlvbl92YWx1ZVxuICAgICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgICBxdWFudGl0eVxuICAgICAgICBzZWN1cml0eV9pZFxuICAgICAgICB1bm9mZmljaWFsX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgcGxhaWRfdHlwZVxuICAgICAgfVxuICAgICAgLi4uIG9uIFNlY3VyaXR5IHtcbiAgICAgICAgY2xvc2VfcHJpY2VcbiAgICAgICAgYWNjb3VudF9pZFxuICAgICAgICBjbG9zZV9wcmljZV9hc19vZlxuICAgICAgICBjb3N0X2Jhc2lzXG4gICAgICAgIGN1c2lwXG4gICAgICAgIGluc3RpdHV0aW9uX2lkXG4gICAgICAgIGluc3RpdHV0aW9uX3NlY3VyaXR5X2lkXG4gICAgICAgIGlzX2Nhc2hfZXF1aXZhbGVudFxuICAgICAgICBpc2luXG4gICAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICAgIG5hbWVcbiAgICAgICAgcHJveHlfc2VjdXJpdHlfaWRcbiAgICAgICAgc2VjdXJpdHlfaWRcbiAgICAgICAgc2Vkb2xcbiAgICAgICAgdGlja2VyX3N5bWJvbFxuICAgICAgICB0eXBlXG4gICAgICAgIHVub2ZmaWNpYWxfY3VycmVuY3lfY29kZVxuICAgICAgICB1cGRhdGVfZGF0ZXRpbWVcbiAgICAgICAgbWFya2V0X2lkZW50aWZpZXJfY29kZVxuICAgICAgICBzZWN0b3JcbiAgICAgICAgaW5kdXN0cnlcbiAgICAgICAgb3B0aW9uX2NvbnRyYWN0XG4gICAgICAgIHBsYWlkX3R5cGVcbiAgICAgIH1cbiAgICB9XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRJbnZlc3RtZW50c1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRJbnZlc3RtZW50c1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEJ1ZGdldHMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRCdWRnZXRzKCRpZDogSUQhLCAkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEJ1ZGdldHMoaWQ6ICRpZCwgbGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgYnVkZ2V0cyB7XG4gICAgICBwa1xuICAgICAgc2tcbiAgICAgIGhpZ2hMZXZlbENhdGVnb3J5XG4gICAgICB0aW1lZnJhbWVcbiAgICAgIHNwZW5kaW5nVGhyZXNob2xkXG4gICAgICBjcmVhdGVkQXRcbiAgICAgIHNwZWNpZmljUGF5ZWVSZWdleFxuICAgICAgcmVjb21tZW5kYXRpb25UaXRsZVxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEJ1ZGdldHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0QnVkZ2V0c1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFNpbXVsYXRpb25FeHBhbnNpb24gPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRGaW5hbmNpYWxTaW11bGF0aW9uRXhwYW5zaW9uKCRjaGF0OiBFeHBhbmRGaW5hbmNpYWxTaW11bGF0aW9uKSB7XG4gIGdldEZpbmFuY2lhbFNpbXVsYXRpb25FeHBhbnNpb24oY2hhdDogJGNoYXQpIHtcbiAgICBzM0tleVxuICAgIG5ld0lucHV0c1xuICAgIGRlc2NyaXB0aW9uXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxTaW11bGF0aW9uRXhwYW5zaW9uUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbFNpbXVsYXRpb25FeHBhbnNpb25RdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnMoJGNoYXQ6IENoYXRRdWVyeSkge1xuICBnZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnMoY2hhdDogJGNoYXQpIHtcbiAgICBleHBsYW5hdGlvblxuICAgIGFjdGlvbiB7XG4gICAgICAuLi4gb24gUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgICAgICB0cmFuc2ZlcnMge1xuICAgICAgICAgIGZyb21BY2NvdW50TmFtZVxuICAgICAgICAgIHRvQWNjb3VudE5hbWVcbiAgICAgICAgICBhbW91bnRcbiAgICAgICAgICBfX3R5cGVuYW1lXG4gICAgICAgIH1cbiAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgIH1cbiAgICAgIC4uLiBvbiBUcmFuc2FjdGlvblJlY29tbWVuZGF0aW9uQWN0aW9uIHtcbiAgICAgICAgYnVkZ2V0IHtcbiAgICAgICAgICBwa1xuICAgICAgICAgIHNrXG4gICAgICAgICAgaGlnaExldmVsQ2F0ZWdvcnlcbiAgICAgICAgICB0aW1lZnJhbWVcbiAgICAgICAgICBzcGVuZGluZ1RocmVzaG9sZFxuICAgICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICAgIHNwZWNpZmljUGF5ZWVSZWdleFxuICAgICAgICAgIHJlY29tbWVuZGF0aW9uVGl0bGVcbiAgICAgICAgICBfX3R5cGVuYW1lXG4gICAgICAgIH1cbiAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgIH1cbiAgICB9XG4gICAgdGl0bGVcbiAgICBwcmlvcml0eVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UoJGNoYXQ6IENoYXRRdWVyeSkge1xuICBnZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZShjaGF0OiAkY2hhdCkge1xuICAgIHJlc3BvbnNlXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZVF1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZVF1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldFNwZW5kaW5nU3VtbWFyeSA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldFNwZW5kaW5nU3VtbWFyeShcbiAgJG1pbkRhdGU6IExvbmdcbiAgJG1heERhdGU6IExvbmdcbiAgJGlkOiBTdHJpbmchXG4gICR0eXBlOiBTcGVuZGluZ1N1bW1hcnlUeXBlXG4pIHtcbiAgZ2V0U3BlbmRpbmdTdW1tYXJ5KFxuICAgIG1pbkRhdGU6ICRtaW5EYXRlXG4gICAgbWF4RGF0ZTogJG1heERhdGVcbiAgICBpZDogJGlkXG4gICAgdHlwZTogJHR5cGVcbiAgKSB7XG4gICAgc2tcbiAgICBzcGVuZGluZ1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0U3BlbmRpbmdTdW1tYXJ5UXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFNwZW5kaW5nU3VtbWFyeVF1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldE5ldFdvcnRocyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldE5ldFdvcnRocyhcbiAgJG1pbkRhdGU6IFN0cmluZ1xuICAkbWF4RGF0ZTogU3RyaW5nXG4gICRpZDogU3RyaW5nIVxuICAkdHlwZTogTmV0V29ydGhTdW1tYXJ5VHlwZVxuKSB7XG4gIGdldE5ldFdvcnRocyhtaW5EYXRlOiAkbWluRGF0ZSwgbWF4RGF0ZTogJG1heERhdGUsIGlkOiAkaWQsIHR5cGU6ICR0eXBlKSB7XG4gICAgcGtcbiAgICBza1xuICAgIG5ldFdvcnRoXG4gICAgdGZzYU5ldFdvcnRoXG4gICAgcnJzcE5ldFdvcnRoXG4gICAgZmhzYU5ldFdvcnRoXG4gICAgc2VjdXJpdHlOZXRXb3J0aFxuICAgIGJhbGFuY2VzXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXROZXRXb3J0aHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0TmV0V29ydGhzUXVlcnlcbj47XG4iXX0=