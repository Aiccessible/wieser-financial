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
exports.getTransactions = `query GetTransactions(
  $id: ID!
  $limit: Int
  $cursor: String
  $personalFinanceCategory: [String]
  $personalFinanceKey: String
  $minDate: String
  $maxDate: String
) {
  getTransactions(
    id: $id
    limit: $limit
    cursor: $cursor
    personalFinanceCategory: $personalFinanceCategory
    personalFinanceKey: $personalFinanceKey
    minDate: $minDate
    maxDate: $maxDate
  ) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxjQUFjLEdBQWlCOzs7Q0FNM0MsQ0FBQztBQUNXLFFBQUEsZUFBZSxHQUFpQjs7Ozs7Ozs7Ozs7O0NBZTVDLENBQUM7QUFDVyxRQUFBLHFCQUFxQixHQUFpQjs7Ozs7OztDQVVsRCxDQUFDO0FBQ1csUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Q0Flc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDO0FBQ1csUUFBQSxlQUFlLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQzVDLENBQUM7QUFDVyxRQUFBLGNBQWMsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpRDNDLENBQUM7QUFDVyxRQUFBLFVBQVUsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J2QyxDQUFDO0FBQ1csUUFBQSwrQkFBK0IsR0FBaUI7Ozs7Ozs7O0NBVzVELENBQUM7QUFDVyxRQUFBLDJCQUEyQixHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0N4RCxDQUFDO0FBQ1csUUFBQSxnQ0FBZ0MsR0FBaUI7Ozs7OztDQVM3RCxDQUFDO0FBQ1csUUFBQSxrQkFBa0IsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0IvQyxDQUFDO0FBQ1csUUFBQSxZQUFZLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQnpDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIHRoaXMgaXMgYW4gYXV0byBnZW5lcmF0ZWQgZmlsZS4gVGhpcyB3aWxsIGJlIG92ZXJ3cml0dGVuXG5cbmltcG9ydCAqIGFzIEFQSVR5cGVzIGZyb20gXCIuLi9BUElcIjtcbnR5cGUgR2VuZXJhdGVkUXVlcnk8SW5wdXRUeXBlLCBPdXRwdXRUeXBlPiA9IHN0cmluZyAmIHtcbiAgX19nZW5lcmF0ZWRRdWVyeUlucHV0OiBJbnB1dFR5cGU7XG4gIF9fZ2VuZXJhdGVkUXVlcnlPdXRwdXQ6IE91dHB1dFR5cGU7XG59O1xuXG5leHBvcnQgY29uc3QgcmV0cnlDb2RlQnVpbGQgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBSZXRyeUNvZGVCdWlsZCgkYnVpbGQ6IFJldHJ5Q29kZUJ1aWxkSW5wdXQpIHtcbiAgcmV0cnlDb2RlQnVpbGQoYnVpbGQ6ICRidWlsZClcbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLlJldHJ5Q29kZUJ1aWxkUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLlJldHJ5Q29kZUJ1aWxkUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0VXNlckFuYWx5c2lzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0VXNlckFuYWx5c2lzIHtcbiAgZ2V0VXNlckFuYWx5c2lzIHtcbiAgICBhbmFseXNpc05hbWVcbiAgICBzM0tleVxuICAgIGN1cnJlbnREZXNjcmlwdGlvblxuICAgIGN1cnJlbnRQcm9qZWN0aW9uXG4gICAgY3VycmVudElucHV0c1xuICAgIHRpdGxlc1xuICAgIGRlc2NyaXB0aW9uc1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0VXNlckFuYWx5c2lzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFVzZXJBbmFseXNpc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldFVzZXJBbmFseXNpc0ZpZWxkcyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldFVzZXJBbmFseXNpc0ZpZWxkcyB7XG4gIGdldFVzZXJBbmFseXNpc0ZpZWxkcyB7XG4gICAgaW5wdXROYW1lXG4gICAgaW5wdXRWYWx1ZVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0VXNlckFuYWx5c2lzRmllbGRzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFVzZXJBbmFseXNpc0ZpZWxkc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEl0ZW1zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0SXRlbXMoJGxpbWl0OiBJbnQsICRjdXJzb3I6IFN0cmluZykge1xuICBnZXRJdGVtcyhsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICBpdGVtcyB7XG4gICAgICBpdGVtX2lkXG4gICAgICBpbnN0aXR1dGlvbl9pZFxuICAgICAgaW5zdGl0dXRpb25fbmFtZVxuICAgICAgc2tcbiAgICAgIGNyZWF0ZWRfYXRcbiAgICAgIHBrXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxBUElUeXBlcy5HZXRJdGVtc1F1ZXJ5VmFyaWFibGVzLCBBUElUeXBlcy5HZXRJdGVtc1F1ZXJ5PjtcbmV4cG9ydCBjb25zdCBnZXRBY2NvdW50cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEFjY291bnRzKCRpZDogSUQhKSB7XG4gIGdldEFjY291bnRzKGlkOiAkaWQpIHtcbiAgICBhY2NvdW50X2lkXG4gICAgdHlwZVxuICAgIG5hbWVcbiAgICBzdWJ0eXBlXG4gICAgYmFsYW5jZXMge1xuICAgICAgY3VycmVudFxuICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgIGF2YWlsYWJsZVxuICAgICAgbGltaXRcbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgbWFza1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0QWNjb3VudHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0QWNjb3VudHNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRUcmFuc2FjdGlvbnMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRUcmFuc2FjdGlvbnMoXG4gICRpZDogSUQhXG4gICRsaW1pdDogSW50XG4gICRjdXJzb3I6IFN0cmluZ1xuICAkcGVyc29uYWxGaW5hbmNlQ2F0ZWdvcnk6IFtTdHJpbmddXG4gICRwZXJzb25hbEZpbmFuY2VLZXk6IFN0cmluZ1xuICAkbWluRGF0ZTogU3RyaW5nXG4gICRtYXhEYXRlOiBTdHJpbmdcbikge1xuICBnZXRUcmFuc2FjdGlvbnMoXG4gICAgaWQ6ICRpZFxuICAgIGxpbWl0OiAkbGltaXRcbiAgICBjdXJzb3I6ICRjdXJzb3JcbiAgICBwZXJzb25hbEZpbmFuY2VDYXRlZ29yeTogJHBlcnNvbmFsRmluYW5jZUNhdGVnb3J5XG4gICAgcGVyc29uYWxGaW5hbmNlS2V5OiAkcGVyc29uYWxGaW5hbmNlS2V5XG4gICAgbWluRGF0ZTogJG1pbkRhdGVcbiAgICBtYXhEYXRlOiAkbWF4RGF0ZVxuICApIHtcbiAgICBjdXJzb3JcbiAgICB0cmFuc2FjdGlvbnMge1xuICAgICAgdHJhbnNhY3Rpb25faWRcbiAgICAgIGFjY291bnRfaWRcbiAgICAgIGFtb3VudFxuICAgICAgbmFtZVxuICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgIGRhdGVcbiAgICAgIHBheW1lbnRfY2hhbm5lbFxuICAgICAgdHJhbnNhY3Rpb25fdHlwZVxuICAgICAgcGVyc29uYWxfZmluYW5jZV9jYXRlZ29yeSB7XG4gICAgICAgIGRldGFpbGVkXG4gICAgICAgIGNvbmZpZGVuY2VfbGV2ZWxcbiAgICAgICAgcHJpbWFyeVxuICAgICAgICBfX3R5cGVuYW1lXG4gICAgICB9XG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0VHJhbnNhY3Rpb25zUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFRyYW5zYWN0aW9uc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEludmVzdG1lbnRzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0SW52ZXN0bWVudHMoJGlkOiBJRCEsICRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0SW52ZXN0bWVudHMoaWQ6ICRpZCwgbGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgdHJhbnNhY3Rpb25zIHtcbiAgICAgIC4uLiBvbiBIb2xkaW5nIHtcbiAgICAgICAgYWNjb3VudF9pZFxuICAgICAgICBjb3N0X2Jhc2lzXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlX2FzX29mXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlX2RhdGV0aW1lXG4gICAgICAgIGluc3RpdHV0aW9uX3ZhbHVlXG4gICAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICAgIHF1YW50aXR5XG4gICAgICAgIHNlY3VyaXR5X2lkXG4gICAgICAgIHVub2ZmaWNpYWxfY3VycmVuY3lfY29kZVxuICAgICAgICBwbGFpZF90eXBlXG4gICAgICB9XG4gICAgICAuLi4gb24gU2VjdXJpdHkge1xuICAgICAgICBjbG9zZV9wcmljZVxuICAgICAgICBhY2NvdW50X2lkXG4gICAgICAgIGNsb3NlX3ByaWNlX2FzX29mXG4gICAgICAgIGNvc3RfYmFzaXNcbiAgICAgICAgY3VzaXBcbiAgICAgICAgaW5zdGl0dXRpb25faWRcbiAgICAgICAgaW5zdGl0dXRpb25fc2VjdXJpdHlfaWRcbiAgICAgICAgaXNfY2FzaF9lcXVpdmFsZW50XG4gICAgICAgIGlzaW5cbiAgICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgbmFtZVxuICAgICAgICBwcm94eV9zZWN1cml0eV9pZFxuICAgICAgICBzZWN1cml0eV9pZFxuICAgICAgICBzZWRvbFxuICAgICAgICB0aWNrZXJfc3ltYm9sXG4gICAgICAgIHR5cGVcbiAgICAgICAgdW5vZmZpY2lhbF9jdXJyZW5jeV9jb2RlXG4gICAgICAgIHVwZGF0ZV9kYXRldGltZVxuICAgICAgICBtYXJrZXRfaWRlbnRpZmllcl9jb2RlXG4gICAgICAgIHNlY3RvclxuICAgICAgICBpbmR1c3RyeVxuICAgICAgICBvcHRpb25fY29udHJhY3RcbiAgICAgICAgcGxhaWRfdHlwZVxuICAgICAgfVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEludmVzdG1lbnRzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEludmVzdG1lbnRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0QnVkZ2V0cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEJ1ZGdldHMoJGlkOiBJRCEsICRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0QnVkZ2V0cyhpZDogJGlkLCBsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICBidWRnZXRzIHtcbiAgICAgIHBrXG4gICAgICBza1xuICAgICAgaGlnaExldmVsQ2F0ZWdvcnlcbiAgICAgIHRpbWVmcmFtZVxuICAgICAgc3BlbmRpbmdUaHJlc2hvbGRcbiAgICAgIGNyZWF0ZWRBdFxuICAgICAgc3BlY2lmaWNQYXllZVJlZ2V4XG4gICAgICByZWNvbW1lbmRhdGlvblRpdGxlXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0QnVkZ2V0c1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRCdWRnZXRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsU2ltdWxhdGlvbkV4cGFuc2lvbiA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEZpbmFuY2lhbFNpbXVsYXRpb25FeHBhbnNpb24oJGNoYXQ6IEV4cGFuZEZpbmFuY2lhbFNpbXVsYXRpb24pIHtcbiAgZ2V0RmluYW5jaWFsU2ltdWxhdGlvbkV4cGFuc2lvbihjaGF0OiAkY2hhdCkge1xuICAgIHMzS2V5XG4gICAgbmV3SW5wdXRzXG4gICAgZGVzY3JpcHRpb25cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbFNpbXVsYXRpb25FeHBhbnNpb25RdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsU2ltdWxhdGlvbkV4cGFuc2lvblF1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9ucyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9ucygkY2hhdDogQ2hhdFF1ZXJ5KSB7XG4gIGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9ucyhjaGF0OiAkY2hhdCkge1xuICAgIGV4cGxhbmF0aW9uXG4gICAgYWN0aW9uIHtcbiAgICAgIC4uLiBvbiBSZWNvbW1lbmRhdGlvbkFjdGlvbiB7XG4gICAgICAgIHRyYW5zZmVycyB7XG4gICAgICAgICAgZnJvbUFjY291bnROYW1lXG4gICAgICAgICAgdG9BY2NvdW50TmFtZVxuICAgICAgICAgIGFtb3VudFxuICAgICAgICAgIF9fdHlwZW5hbWVcbiAgICAgICAgfVxuICAgICAgICBkZXNjcmlwdGlvblxuICAgICAgfVxuICAgICAgLi4uIG9uIFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgICAgICBidWRnZXQge1xuICAgICAgICAgIHBrXG4gICAgICAgICAgc2tcbiAgICAgICAgICBoaWdoTGV2ZWxDYXRlZ29yeVxuICAgICAgICAgIHRpbWVmcmFtZVxuICAgICAgICAgIHNwZW5kaW5nVGhyZXNob2xkXG4gICAgICAgICAgY3JlYXRlZEF0XG4gICAgICAgICAgc3BlY2lmaWNQYXllZVJlZ2V4XG4gICAgICAgICAgcmVjb21tZW5kYXRpb25UaXRsZVxuICAgICAgICAgIF9fdHlwZW5hbWVcbiAgICAgICAgfVxuICAgICAgICBkZXNjcmlwdGlvblxuICAgICAgfVxuICAgIH1cbiAgICB0aXRsZVxuICAgIHByaW9yaXR5XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZSgkY2hhdDogQ2hhdFF1ZXJ5KSB7XG4gIGdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlKGNoYXQ6ICRjaGF0KSB7XG4gICAgcmVzcG9uc2VcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0U3BlbmRpbmdTdW1tYXJ5ID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0U3BlbmRpbmdTdW1tYXJ5KFxuICAkbWluRGF0ZTogTG9uZ1xuICAkbWF4RGF0ZTogTG9uZ1xuICAkaWQ6IFN0cmluZyFcbiAgJHR5cGU6IFNwZW5kaW5nU3VtbWFyeVR5cGVcbikge1xuICBnZXRTcGVuZGluZ1N1bW1hcnkoXG4gICAgbWluRGF0ZTogJG1pbkRhdGVcbiAgICBtYXhEYXRlOiAkbWF4RGF0ZVxuICAgIGlkOiAkaWRcbiAgICB0eXBlOiAkdHlwZVxuICApIHtcbiAgICBza1xuICAgIHNwZW5kaW5nXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRTcGVuZGluZ1N1bW1hcnlRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0U3BlbmRpbmdTdW1tYXJ5UXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0TmV0V29ydGhzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0TmV0V29ydGhzKFxuICAkbWluRGF0ZTogU3RyaW5nXG4gICRtYXhEYXRlOiBTdHJpbmdcbiAgJGlkOiBTdHJpbmchXG4gICR0eXBlOiBOZXRXb3J0aFN1bW1hcnlUeXBlXG4pIHtcbiAgZ2V0TmV0V29ydGhzKG1pbkRhdGU6ICRtaW5EYXRlLCBtYXhEYXRlOiAkbWF4RGF0ZSwgaWQ6ICRpZCwgdHlwZTogJHR5cGUpIHtcbiAgICBwa1xuICAgIHNrXG4gICAgbmV0V29ydGhcbiAgICB0ZnNhTmV0V29ydGhcbiAgICBycnNwTmV0V29ydGhcbiAgICBmaHNhTmV0V29ydGhcbiAgICBzZWN1cml0eU5ldFdvcnRoXG4gICAgYmFsYW5jZXNcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldE5ldFdvcnRoc1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXROZXRXb3J0aHNRdWVyeVxuPjtcbiJdfQ==