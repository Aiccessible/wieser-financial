"use strict";
/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetWorths = exports.getSpendingSummary = exports.getFinancialConversationResponse = exports.getFinancialRecommendations = exports.getInvestments = exports.getTransactions = exports.getAccounts = exports.getItems = void 0;
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
exports.getFinancialRecommendations = `query GetFinancialRecommendations($chat: ChatQuery) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Q0Flc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDO0FBQ1csUUFBQSxlQUFlLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCNUMsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlEM0MsQ0FBQztBQUNXLFFBQUEsMkJBQTJCLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQnhELENBQUM7QUFDVyxRQUFBLGdDQUFnQyxHQUFpQjs7Ozs7O0NBUzdELENBQUM7QUFDVyxRQUFBLGtCQUFrQixHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQi9DLENBQUM7QUFDVyxRQUFBLFlBQVksR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlICovXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gdGhpcyBpcyBhbiBhdXRvIGdlbmVyYXRlZCBmaWxlLiBUaGlzIHdpbGwgYmUgb3ZlcndyaXR0ZW5cblxuaW1wb3J0ICogYXMgQVBJVHlwZXMgZnJvbSBcIi4uL0FQSVwiO1xudHlwZSBHZW5lcmF0ZWRRdWVyeTxJbnB1dFR5cGUsIE91dHB1dFR5cGU+ID0gc3RyaW5nICYge1xuICBfX2dlbmVyYXRlZFF1ZXJ5SW5wdXQ6IElucHV0VHlwZTtcbiAgX19nZW5lcmF0ZWRRdWVyeU91dHB1dDogT3V0cHV0VHlwZTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRJdGVtcyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEl0ZW1zKCRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0SXRlbXMobGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgaXRlbXMge1xuICAgICAgaXRlbV9pZFxuICAgICAgaW5zdGl0dXRpb25faWRcbiAgICAgIGluc3RpdHV0aW9uX25hbWVcbiAgICAgIHNrXG4gICAgICBjcmVhdGVkX2F0XG4gICAgICBwa1xuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8QVBJVHlwZXMuR2V0SXRlbXNRdWVyeVZhcmlhYmxlcywgQVBJVHlwZXMuR2V0SXRlbXNRdWVyeT47XG5leHBvcnQgY29uc3QgZ2V0QWNjb3VudHMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRBY2NvdW50cygkaWQ6IElEISkge1xuICBnZXRBY2NvdW50cyhpZDogJGlkKSB7XG4gICAgYWNjb3VudF9pZFxuICAgIHR5cGVcbiAgICBuYW1lXG4gICAgc3VidHlwZVxuICAgIGJhbGFuY2VzIHtcbiAgICAgIGN1cnJlbnRcbiAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICBhdmFpbGFibGVcbiAgICAgIGxpbWl0XG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIG1hc2tcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEFjY291bnRzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEFjY291bnRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0VHJhbnNhY3Rpb25zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0VHJhbnNhY3Rpb25zKCRpZDogSUQhLCAkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldFRyYW5zYWN0aW9ucyhpZDogJGlkLCBsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICB0cmFuc2FjdGlvbnMge1xuICAgICAgdHJhbnNhY3Rpb25faWRcbiAgICAgIGFjY291bnRfaWRcbiAgICAgIGFtb3VudFxuICAgICAgbmFtZVxuICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgIGRhdGVcbiAgICAgIHBheW1lbnRfY2hhbm5lbFxuICAgICAgdHJhbnNhY3Rpb25fdHlwZVxuICAgICAgcGVyc29uYWxfZmluYW5jZV9jYXRlZ29yeSB7XG4gICAgICAgIGRldGFpbGVkXG4gICAgICAgIGNvbmZpZGVuY2VfbGV2ZWxcbiAgICAgICAgcHJpbWFyeVxuICAgICAgICBfX3R5cGVuYW1lXG4gICAgICB9XG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0VHJhbnNhY3Rpb25zUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFRyYW5zYWN0aW9uc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEludmVzdG1lbnRzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0SW52ZXN0bWVudHMoJGlkOiBJRCEsICRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0SW52ZXN0bWVudHMoaWQ6ICRpZCwgbGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgdHJhbnNhY3Rpb25zIHtcbiAgICAgIC4uLiBvbiBIb2xkaW5nIHtcbiAgICAgICAgYWNjb3VudF9pZFxuICAgICAgICBjb3N0X2Jhc2lzXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlX2FzX29mXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlX2RhdGV0aW1lXG4gICAgICAgIGluc3RpdHV0aW9uX3ZhbHVlXG4gICAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICAgIHF1YW50aXR5XG4gICAgICAgIHNlY3VyaXR5X2lkXG4gICAgICAgIHVub2ZmaWNpYWxfY3VycmVuY3lfY29kZVxuICAgICAgICBwbGFpZF90eXBlXG4gICAgICB9XG4gICAgICAuLi4gb24gU2VjdXJpdHkge1xuICAgICAgICBjbG9zZV9wcmljZVxuICAgICAgICBhY2NvdW50X2lkXG4gICAgICAgIGNsb3NlX3ByaWNlX2FzX29mXG4gICAgICAgIGNvc3RfYmFzaXNcbiAgICAgICAgY3VzaXBcbiAgICAgICAgaW5zdGl0dXRpb25faWRcbiAgICAgICAgaW5zdGl0dXRpb25fc2VjdXJpdHlfaWRcbiAgICAgICAgaXNfY2FzaF9lcXVpdmFsZW50XG4gICAgICAgIGlzaW5cbiAgICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgbmFtZVxuICAgICAgICBwcm94eV9zZWN1cml0eV9pZFxuICAgICAgICBzZWN1cml0eV9pZFxuICAgICAgICBzZWRvbFxuICAgICAgICB0aWNrZXJfc3ltYm9sXG4gICAgICAgIHR5cGVcbiAgICAgICAgdW5vZmZpY2lhbF9jdXJyZW5jeV9jb2RlXG4gICAgICAgIHVwZGF0ZV9kYXRldGltZVxuICAgICAgICBtYXJrZXRfaWRlbnRpZmllcl9jb2RlXG4gICAgICAgIHNlY3RvclxuICAgICAgICBpbmR1c3RyeVxuICAgICAgICBvcHRpb25fY29udHJhY3RcbiAgICAgICAgcGxhaWRfdHlwZVxuICAgICAgfVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEludmVzdG1lbnRzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEludmVzdG1lbnRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zKCRjaGF0OiBDaGF0UXVlcnkpIHtcbiAgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zKGNoYXQ6ICRjaGF0KSB7XG4gICAgZXhwbGFuYXRpb25cbiAgICBhY3Rpb24ge1xuICAgICAgdHJhbnNmZXJzIHtcbiAgICAgICAgZnJvbUFjY291bnROYW1lXG4gICAgICAgIHRvQWNjb3VudE5hbWVcbiAgICAgICAgYW1vdW50XG4gICAgICAgIF9fdHlwZW5hbWVcbiAgICAgIH1cbiAgICAgIGRlc2NyaXB0aW9uXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIHRpdGxlXG4gICAgcHJpb3JpdHlcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZSA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlKCRjaGF0OiBDaGF0UXVlcnkpIHtcbiAgZ2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UoY2hhdDogJGNoYXQpIHtcbiAgICByZXNwb25zZVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2VRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2VRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRTcGVuZGluZ1N1bW1hcnkgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRTcGVuZGluZ1N1bW1hcnkoXG4gICRtaW5EYXRlOiBMb25nXG4gICRtYXhEYXRlOiBMb25nXG4gICRpZDogU3RyaW5nIVxuICAkdHlwZTogU3BlbmRpbmdTdW1tYXJ5VHlwZVxuKSB7XG4gIGdldFNwZW5kaW5nU3VtbWFyeShcbiAgICBtaW5EYXRlOiAkbWluRGF0ZVxuICAgIG1heERhdGU6ICRtYXhEYXRlXG4gICAgaWQ6ICRpZFxuICAgIHR5cGU6ICR0eXBlXG4gICkge1xuICAgIHNrXG4gICAgc3BlbmRpbmdcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldFNwZW5kaW5nU3VtbWFyeVF1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRTcGVuZGluZ1N1bW1hcnlRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXROZXRXb3J0aHMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXROZXRXb3J0aHMoXG4gICRtaW5EYXRlOiBTdHJpbmdcbiAgJG1heERhdGU6IFN0cmluZ1xuICAkaWQ6IFN0cmluZyFcbiAgJHR5cGU6IE5ldFdvcnRoU3VtbWFyeVR5cGVcbikge1xuICBnZXROZXRXb3J0aHMobWluRGF0ZTogJG1pbkRhdGUsIG1heERhdGU6ICRtYXhEYXRlLCBpZDogJGlkLCB0eXBlOiAkdHlwZSkge1xuICAgIHBrXG4gICAgc2tcbiAgICBuZXRXb3J0aFxuICAgIHRmc2FOZXRXb3J0aFxuICAgIHJyc3BOZXRXb3J0aFxuICAgIGZoc2FOZXRXb3J0aFxuICAgIHNlY3VyaXR5TmV0V29ydGhcbiAgICBiYWxhbmNlc1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0TmV0V29ydGhzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldE5ldFdvcnRoc1F1ZXJ5XG4+O1xuIl19