"use strict";
/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetWorth = exports.getSpendingSummary = exports.getFinancialConversationResponse = exports.getFinancialRecommendations = exports.getInvestments = exports.getTransactions = exports.getAccounts = exports.getItems = void 0;
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
exports.getNetWorth = `query GetNetWorth(
  $minDate: Long
  $maxDate: Long
  $id: String!
  $type: SpendingSummaryType
) {
  getNetWorth(minDate: $minDate, maxDate: $maxDate, id: $id, type: $type) {
    pk
    sk
    netWorth
    tfsaNetWorth
    rrspNetWorth
    fhsaNetWorth
    securityNetWorth
    __typename
  }
}
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Q0Flc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDO0FBQ1csUUFBQSxlQUFlLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCNUMsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlEM0MsQ0FBQztBQUNXLFFBQUEsMkJBQTJCLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQnhELENBQUM7QUFDVyxRQUFBLGdDQUFnQyxHQUFpQjs7Ozs7O0NBUzdELENBQUM7QUFDVyxRQUFBLGtCQUFrQixHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQi9DLENBQUM7QUFDVyxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG4vLyB0aGlzIGlzIGFuIGF1dG8gZ2VuZXJhdGVkIGZpbGUuIFRoaXMgd2lsbCBiZSBvdmVyd3JpdHRlblxuXG5pbXBvcnQgKiBhcyBBUElUeXBlcyBmcm9tIFwiLi4vQVBJXCI7XG50eXBlIEdlbmVyYXRlZFF1ZXJ5PElucHV0VHlwZSwgT3V0cHV0VHlwZT4gPSBzdHJpbmcgJiB7XG4gIF9fZ2VuZXJhdGVkUXVlcnlJbnB1dDogSW5wdXRUeXBlO1xuICBfX2dlbmVyYXRlZFF1ZXJ5T3V0cHV0OiBPdXRwdXRUeXBlO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldEl0ZW1zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0SXRlbXMoJGxpbWl0OiBJbnQsICRjdXJzb3I6IFN0cmluZykge1xuICBnZXRJdGVtcyhsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICBpdGVtcyB7XG4gICAgICBpdGVtX2lkXG4gICAgICBpbnN0aXR1dGlvbl9pZFxuICAgICAgaW5zdGl0dXRpb25fbmFtZVxuICAgICAgc2tcbiAgICAgIGNyZWF0ZWRfYXRcbiAgICAgIHBrXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxBUElUeXBlcy5HZXRJdGVtc1F1ZXJ5VmFyaWFibGVzLCBBUElUeXBlcy5HZXRJdGVtc1F1ZXJ5PjtcbmV4cG9ydCBjb25zdCBnZXRBY2NvdW50cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEFjY291bnRzKCRpZDogSUQhKSB7XG4gIGdldEFjY291bnRzKGlkOiAkaWQpIHtcbiAgICBhY2NvdW50X2lkXG4gICAgdHlwZVxuICAgIG5hbWVcbiAgICBzdWJ0eXBlXG4gICAgYmFsYW5jZXMge1xuICAgICAgY3VycmVudFxuICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgIGF2YWlsYWJsZVxuICAgICAgbGltaXRcbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgbWFza1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0QWNjb3VudHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0QWNjb3VudHNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRUcmFuc2FjdGlvbnMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRUcmFuc2FjdGlvbnMoJGlkOiBJRCEsICRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0VHJhbnNhY3Rpb25zKGlkOiAkaWQsIGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIHRyYW5zYWN0aW9ucyB7XG4gICAgICB0cmFuc2FjdGlvbl9pZFxuICAgICAgYWNjb3VudF9pZFxuICAgICAgYW1vdW50XG4gICAgICBuYW1lXG4gICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgZGF0ZVxuICAgICAgcGF5bWVudF9jaGFubmVsXG4gICAgICB0cmFuc2FjdGlvbl90eXBlXG4gICAgICBwZXJzb25hbF9maW5hbmNlX2NhdGVnb3J5IHtcbiAgICAgICAgZGV0YWlsZWRcbiAgICAgICAgY29uZmlkZW5jZV9sZXZlbFxuICAgICAgICBwcmltYXJ5XG4gICAgICAgIF9fdHlwZW5hbWVcbiAgICAgIH1cbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRUcmFuc2FjdGlvbnNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0VHJhbnNhY3Rpb25zUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0SW52ZXN0bWVudHMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRJbnZlc3RtZW50cygkaWQ6IElEISwgJGxpbWl0OiBJbnQsICRjdXJzb3I6IFN0cmluZykge1xuICBnZXRJbnZlc3RtZW50cyhpZDogJGlkLCBsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICB0cmFuc2FjdGlvbnMge1xuICAgICAgLi4uIG9uIEhvbGRpbmcge1xuICAgICAgICBhY2NvdW50X2lkXG4gICAgICAgIGNvc3RfYmFzaXNcbiAgICAgICAgaW5zdGl0dXRpb25fcHJpY2VcbiAgICAgICAgaW5zdGl0dXRpb25fcHJpY2VfYXNfb2ZcbiAgICAgICAgaW5zdGl0dXRpb25fcHJpY2VfZGF0ZXRpbWVcbiAgICAgICAgaW5zdGl0dXRpb25fdmFsdWVcbiAgICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgcXVhbnRpdHlcbiAgICAgICAgc2VjdXJpdHlfaWRcbiAgICAgICAgdW5vZmZpY2lhbF9jdXJyZW5jeV9jb2RlXG4gICAgICAgIHBsYWlkX3R5cGVcbiAgICAgIH1cbiAgICAgIC4uLiBvbiBTZWN1cml0eSB7XG4gICAgICAgIGNsb3NlX3ByaWNlXG4gICAgICAgIGFjY291bnRfaWRcbiAgICAgICAgY2xvc2VfcHJpY2VfYXNfb2ZcbiAgICAgICAgY29zdF9iYXNpc1xuICAgICAgICBjdXNpcFxuICAgICAgICBpbnN0aXR1dGlvbl9pZFxuICAgICAgICBpbnN0aXR1dGlvbl9zZWN1cml0eV9pZFxuICAgICAgICBpc19jYXNoX2VxdWl2YWxlbnRcbiAgICAgICAgaXNpblxuICAgICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgICBuYW1lXG4gICAgICAgIHByb3h5X3NlY3VyaXR5X2lkXG4gICAgICAgIHNlY3VyaXR5X2lkXG4gICAgICAgIHNlZG9sXG4gICAgICAgIHRpY2tlcl9zeW1ib2xcbiAgICAgICAgdHlwZVxuICAgICAgICB1bm9mZmljaWFsX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgdXBkYXRlX2RhdGV0aW1lXG4gICAgICAgIG1hcmtldF9pZGVudGlmaWVyX2NvZGVcbiAgICAgICAgc2VjdG9yXG4gICAgICAgIGluZHVzdHJ5XG4gICAgICAgIG9wdGlvbl9jb250cmFjdFxuICAgICAgICBwbGFpZF90eXBlXG4gICAgICB9XG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0SW52ZXN0bWVudHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0SW52ZXN0bWVudHNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnMoJGNoYXQ6IENoYXRRdWVyeSkge1xuICBnZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnMoY2hhdDogJGNoYXQpIHtcbiAgICBleHBsYW5hdGlvblxuICAgIGFjdGlvbiB7XG4gICAgICB0cmFuc2ZlcnMge1xuICAgICAgICBmcm9tQWNjb3VudE5hbWVcbiAgICAgICAgdG9BY2NvdW50TmFtZVxuICAgICAgICBhbW91bnRcbiAgICAgICAgX190eXBlbmFtZVxuICAgICAgfVxuICAgICAgZGVzY3JpcHRpb25cbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgdGl0bGVcbiAgICBwcmlvcml0eVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UoJGNoYXQ6IENoYXRRdWVyeSkge1xuICBnZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZShjaGF0OiAkY2hhdCkge1xuICAgIHJlc3BvbnNlXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZVF1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZVF1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldFNwZW5kaW5nU3VtbWFyeSA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldFNwZW5kaW5nU3VtbWFyeShcbiAgJG1pbkRhdGU6IExvbmdcbiAgJG1heERhdGU6IExvbmdcbiAgJGlkOiBTdHJpbmchXG4gICR0eXBlOiBTcGVuZGluZ1N1bW1hcnlUeXBlXG4pIHtcbiAgZ2V0U3BlbmRpbmdTdW1tYXJ5KFxuICAgIG1pbkRhdGU6ICRtaW5EYXRlXG4gICAgbWF4RGF0ZTogJG1heERhdGVcbiAgICBpZDogJGlkXG4gICAgdHlwZTogJHR5cGVcbiAgKSB7XG4gICAgc2tcbiAgICBzcGVuZGluZ1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0U3BlbmRpbmdTdW1tYXJ5UXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFNwZW5kaW5nU3VtbWFyeVF1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldE5ldFdvcnRoID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0TmV0V29ydGgoXG4gICRtaW5EYXRlOiBMb25nXG4gICRtYXhEYXRlOiBMb25nXG4gICRpZDogU3RyaW5nIVxuICAkdHlwZTogU3BlbmRpbmdTdW1tYXJ5VHlwZVxuKSB7XG4gIGdldE5ldFdvcnRoKG1pbkRhdGU6ICRtaW5EYXRlLCBtYXhEYXRlOiAkbWF4RGF0ZSwgaWQ6ICRpZCwgdHlwZTogJHR5cGUpIHtcbiAgICBwa1xuICAgIHNrXG4gICAgbmV0V29ydGhcbiAgICB0ZnNhTmV0V29ydGhcbiAgICBycnNwTmV0V29ydGhcbiAgICBmaHNhTmV0V29ydGhcbiAgICBzZWN1cml0eU5ldFdvcnRoXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXROZXRXb3J0aFF1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXROZXRXb3J0aFF1ZXJ5XG4+O1xuIl19