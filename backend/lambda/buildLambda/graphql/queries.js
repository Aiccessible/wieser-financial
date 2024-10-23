"use strict";
/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialConversationResponse = exports.getFinancialRecommendations = exports.getInvestments = exports.getTransactions = exports.getAccounts = exports.getItems = void 0;
exports.getItems = `query GetItems($limit: Int, $cursor: String) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Q0FZc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDO0FBQ1csUUFBQSxlQUFlLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7OztDQW9CNUMsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlEM0MsQ0FBQztBQUNXLFFBQUEsMkJBQTJCLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQnhELENBQUM7QUFDVyxRQUFBLGdDQUFnQyxHQUFpQjs7Ozs7O0NBUzdELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIHRoaXMgaXMgYW4gYXV0byBnZW5lcmF0ZWQgZmlsZS4gVGhpcyB3aWxsIGJlIG92ZXJ3cml0dGVuXG5cbmltcG9ydCAqIGFzIEFQSVR5cGVzIGZyb20gXCIuLi9BUElcIjtcbnR5cGUgR2VuZXJhdGVkUXVlcnk8SW5wdXRUeXBlLCBPdXRwdXRUeXBlPiA9IHN0cmluZyAmIHtcbiAgX19nZW5lcmF0ZWRRdWVyeUlucHV0OiBJbnB1dFR5cGU7XG4gIF9fZ2VuZXJhdGVkUXVlcnlPdXRwdXQ6IE91dHB1dFR5cGU7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0SXRlbXMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRJdGVtcygkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEl0ZW1zKGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIGl0ZW1zIHtcbiAgICAgIGl0ZW1faWRcbiAgICAgIGluc3RpdHV0aW9uX2lkXG4gICAgICBpbnN0aXR1dGlvbl9uYW1lXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxBUElUeXBlcy5HZXRJdGVtc1F1ZXJ5VmFyaWFibGVzLCBBUElUeXBlcy5HZXRJdGVtc1F1ZXJ5PjtcbmV4cG9ydCBjb25zdCBnZXRBY2NvdW50cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEFjY291bnRzKCRpZDogSUQhKSB7XG4gIGdldEFjY291bnRzKGlkOiAkaWQpIHtcbiAgICBhY2NvdW50X2lkXG4gICAgdHlwZVxuICAgIG5hbWVcbiAgICBzdWJ0eXBlXG4gICAgYmFsYW5jZXMge1xuICAgICAgY3VycmVudFxuICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgIGF2YWlsYWJsZVxuICAgICAgbGltaXRcbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgbWFza1xuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0QWNjb3VudHNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0QWNjb3VudHNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRUcmFuc2FjdGlvbnMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRUcmFuc2FjdGlvbnMoJGlkOiBJRCEsICRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0VHJhbnNhY3Rpb25zKGlkOiAkaWQsIGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIHRyYW5zYWN0aW9ucyB7XG4gICAgICB0cmFuc2FjdGlvbl9pZFxuICAgICAgYWNjb3VudF9pZFxuICAgICAgYW1vdW50XG4gICAgICBuYW1lXG4gICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgZGF0ZVxuICAgICAgcGF5bWVudF9jaGFubmVsXG4gICAgICB0cmFuc2FjdGlvbl90eXBlXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0VHJhbnNhY3Rpb25zUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFRyYW5zYWN0aW9uc1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEludmVzdG1lbnRzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0SW52ZXN0bWVudHMoJGlkOiBJRCEsICRsaW1pdDogSW50LCAkY3Vyc29yOiBTdHJpbmcpIHtcbiAgZ2V0SW52ZXN0bWVudHMoaWQ6ICRpZCwgbGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgdHJhbnNhY3Rpb25zIHtcbiAgICAgIC4uLiBvbiBIb2xkaW5nIHtcbiAgICAgICAgYWNjb3VudF9pZFxuICAgICAgICBjb3N0X2Jhc2lzXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlX2FzX29mXG4gICAgICAgIGluc3RpdHV0aW9uX3ByaWNlX2RhdGV0aW1lXG4gICAgICAgIGluc3RpdHV0aW9uX3ZhbHVlXG4gICAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICAgIHF1YW50aXR5XG4gICAgICAgIHNlY3VyaXR5X2lkXG4gICAgICAgIHVub2ZmaWNpYWxfY3VycmVuY3lfY29kZVxuICAgICAgICBwbGFpZF90eXBlXG4gICAgICB9XG4gICAgICAuLi4gb24gU2VjdXJpdHkge1xuICAgICAgICBjbG9zZV9wcmljZVxuICAgICAgICBhY2NvdW50X2lkXG4gICAgICAgIGNsb3NlX3ByaWNlX2FzX29mXG4gICAgICAgIGNvc3RfYmFzaXNcbiAgICAgICAgY3VzaXBcbiAgICAgICAgaW5zdGl0dXRpb25faWRcbiAgICAgICAgaW5zdGl0dXRpb25fc2VjdXJpdHlfaWRcbiAgICAgICAgaXNfY2FzaF9lcXVpdmFsZW50XG4gICAgICAgIGlzaW5cbiAgICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgbmFtZVxuICAgICAgICBwcm94eV9zZWN1cml0eV9pZFxuICAgICAgICBzZWN1cml0eV9pZFxuICAgICAgICBzZWRvbFxuICAgICAgICB0aWNrZXJfc3ltYm9sXG4gICAgICAgIHR5cGVcbiAgICAgICAgdW5vZmZpY2lhbF9jdXJyZW5jeV9jb2RlXG4gICAgICAgIHVwZGF0ZV9kYXRldGltZVxuICAgICAgICBtYXJrZXRfaWRlbnRpZmllcl9jb2RlXG4gICAgICAgIHNlY3RvclxuICAgICAgICBpbmR1c3RyeVxuICAgICAgICBvcHRpb25fY29udHJhY3RcbiAgICAgICAgcGxhaWRfdHlwZVxuICAgICAgfVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEludmVzdG1lbnRzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEludmVzdG1lbnRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zKCRjaGF0OiBDaGF0UXVlcnkpIHtcbiAgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zKGNoYXQ6ICRjaGF0KSB7XG4gICAgZXhwbGFuYXRpb25cbiAgICBhY3Rpb24ge1xuICAgICAgdHJhbnNmZXJzIHtcbiAgICAgICAgZnJvbUFjY291bnROYW1lXG4gICAgICAgIHRvQWNjb3VudE5hbWVcbiAgICAgICAgYW1vdW50XG4gICAgICAgIF9fdHlwZW5hbWVcbiAgICAgIH1cbiAgICAgIGRlc2NyaXB0aW9uXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIHRpdGxlXG4gICAgcHJpb3JpdHlcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZSA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlKCRjaGF0OiBDaGF0UXVlcnkpIHtcbiAgZ2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UoY2hhdDogJGNoYXQpIHtcbiAgICByZXNwb25zZVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2VRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2VRdWVyeVxuPjtcbiJdfQ==