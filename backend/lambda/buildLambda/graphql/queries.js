"use strict";
/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpendingSummary = exports.getFinancialConversationResponse = exports.getFinancialRecommendations = exports.getInvestments = exports.getTransactions = exports.getAccounts = exports.getItems = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Q0Flc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J4QyxDQUFDO0FBQ1csUUFBQSxlQUFlLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCNUMsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlEM0MsQ0FBQztBQUNXLFFBQUEsMkJBQTJCLEdBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQnhELENBQUM7QUFDVyxRQUFBLGdDQUFnQyxHQUFpQjs7Ozs7O0NBUzdELENBQUM7QUFDVyxRQUFBLGtCQUFrQixHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQi9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8vIHRoaXMgaXMgYW4gYXV0byBnZW5lcmF0ZWQgZmlsZS4gVGhpcyB3aWxsIGJlIG92ZXJ3cml0dGVuXG5cbmltcG9ydCAqIGFzIEFQSVR5cGVzIGZyb20gXCIuLi9BUElcIjtcbnR5cGUgR2VuZXJhdGVkUXVlcnk8SW5wdXRUeXBlLCBPdXRwdXRUeXBlPiA9IHN0cmluZyAmIHtcbiAgX19nZW5lcmF0ZWRRdWVyeUlucHV0OiBJbnB1dFR5cGU7XG4gIF9fZ2VuZXJhdGVkUXVlcnlPdXRwdXQ6IE91dHB1dFR5cGU7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0SXRlbXMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRJdGVtcygkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEl0ZW1zKGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIGl0ZW1zIHtcbiAgICAgIGl0ZW1faWRcbiAgICAgIGluc3RpdHV0aW9uX2lkXG4gICAgICBpbnN0aXR1dGlvbl9uYW1lXG4gICAgICBza1xuICAgICAgY3JlYXRlZF9hdFxuICAgICAgcGtcbiAgICAgIF9fdHlwZW5hbWVcbiAgICB9XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PEFQSVR5cGVzLkdldEl0ZW1zUXVlcnlWYXJpYWJsZXMsIEFQSVR5cGVzLkdldEl0ZW1zUXVlcnk+O1xuZXhwb3J0IGNvbnN0IGdldEFjY291bnRzID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0QWNjb3VudHMoJGlkOiBJRCEpIHtcbiAgZ2V0QWNjb3VudHMoaWQ6ICRpZCkge1xuICAgIGFjY291bnRfaWRcbiAgICB0eXBlXG4gICAgbmFtZVxuICAgIHN1YnR5cGVcbiAgICBiYWxhbmNlcyB7XG4gICAgICBjdXJyZW50XG4gICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgYXZhaWxhYmxlXG4gICAgICBsaW1pdFxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBtYXNrXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRBY2NvdW50c1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRBY2NvdW50c1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldFRyYW5zYWN0aW9ucyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldFRyYW5zYWN0aW9ucygkaWQ6IElEISwgJGxpbWl0OiBJbnQsICRjdXJzb3I6IFN0cmluZykge1xuICBnZXRUcmFuc2FjdGlvbnMoaWQ6ICRpZCwgbGltaXQ6ICRsaW1pdCwgY3Vyc29yOiAkY3Vyc29yKSB7XG4gICAgY3Vyc29yXG4gICAgdHJhbnNhY3Rpb25zIHtcbiAgICAgIHRyYW5zYWN0aW9uX2lkXG4gICAgICBhY2NvdW50X2lkXG4gICAgICBhbW91bnRcbiAgICAgIG5hbWVcbiAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICBkYXRlXG4gICAgICBwYXltZW50X2NoYW5uZWxcbiAgICAgIHRyYW5zYWN0aW9uX3R5cGVcbiAgICAgIHBlcnNvbmFsX2ZpbmFuY2VfY2F0ZWdvcnkge1xuICAgICAgICBkZXRhaWxlZFxuICAgICAgICBjb25maWRlbmNlX2xldmVsXG4gICAgICAgIHByaW1hcnlcbiAgICAgICAgX190eXBlbmFtZVxuICAgICAgfVxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldFRyYW5zYWN0aW9uc1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRUcmFuc2FjdGlvbnNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRJbnZlc3RtZW50cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEludmVzdG1lbnRzKCRpZDogSUQhLCAkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEludmVzdG1lbnRzKGlkOiAkaWQsIGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIHRyYW5zYWN0aW9ucyB7XG4gICAgICAuLi4gb24gSG9sZGluZyB7XG4gICAgICAgIGFjY291bnRfaWRcbiAgICAgICAgY29zdF9iYXNpc1xuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZVxuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZV9hc19vZlxuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZV9kYXRldGltZVxuICAgICAgICBpbnN0aXR1dGlvbl92YWx1ZVxuICAgICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgICBxdWFudGl0eVxuICAgICAgICBzZWN1cml0eV9pZFxuICAgICAgICB1bm9mZmljaWFsX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgcGxhaWRfdHlwZVxuICAgICAgfVxuICAgICAgLi4uIG9uIFNlY3VyaXR5IHtcbiAgICAgICAgY2xvc2VfcHJpY2VcbiAgICAgICAgYWNjb3VudF9pZFxuICAgICAgICBjbG9zZV9wcmljZV9hc19vZlxuICAgICAgICBjb3N0X2Jhc2lzXG4gICAgICAgIGN1c2lwXG4gICAgICAgIGluc3RpdHV0aW9uX2lkXG4gICAgICAgIGluc3RpdHV0aW9uX3NlY3VyaXR5X2lkXG4gICAgICAgIGlzX2Nhc2hfZXF1aXZhbGVudFxuICAgICAgICBpc2luXG4gICAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICAgIG5hbWVcbiAgICAgICAgcHJveHlfc2VjdXJpdHlfaWRcbiAgICAgICAgc2VjdXJpdHlfaWRcbiAgICAgICAgc2Vkb2xcbiAgICAgICAgdGlja2VyX3N5bWJvbFxuICAgICAgICB0eXBlXG4gICAgICAgIHVub2ZmaWNpYWxfY3VycmVuY3lfY29kZVxuICAgICAgICB1cGRhdGVfZGF0ZXRpbWVcbiAgICAgICAgbWFya2V0X2lkZW50aWZpZXJfY29kZVxuICAgICAgICBzZWN0b3JcbiAgICAgICAgaW5kdXN0cnlcbiAgICAgICAgb3B0aW9uX2NvbnRyYWN0XG4gICAgICAgIHBsYWlkX3R5cGVcbiAgICAgIH1cbiAgICB9XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRJbnZlc3RtZW50c1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRJbnZlc3RtZW50c1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9ucyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9ucygkY2hhdDogQ2hhdFF1ZXJ5KSB7XG4gIGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9ucyhjaGF0OiAkY2hhdCkge1xuICAgIGV4cGxhbmF0aW9uXG4gICAgYWN0aW9uIHtcbiAgICAgIHRyYW5zZmVycyB7XG4gICAgICAgIGZyb21BY2NvdW50TmFtZVxuICAgICAgICB0b0FjY291bnROYW1lXG4gICAgICAgIGFtb3VudFxuICAgICAgICBfX3R5cGVuYW1lXG4gICAgICB9XG4gICAgICBkZXNjcmlwdGlvblxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICB0aXRsZVxuICAgIHByaW9yaXR5XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnNRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZSgkY2hhdDogQ2hhdFF1ZXJ5KSB7XG4gIGdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlKGNoYXQ6ICRjaGF0KSB7XG4gICAgcmVzcG9uc2VcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0U3BlbmRpbmdTdW1tYXJ5ID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0U3BlbmRpbmdTdW1tYXJ5KFxuICAkbWluRGF0ZTogTG9uZ1xuICAkbWF4RGF0ZTogTG9uZ1xuICAkaWQ6IFN0cmluZyFcbiAgJHR5cGU6IFNwZW5kaW5nU3VtbWFyeVR5cGVcbikge1xuICBnZXRTcGVuZGluZ1N1bW1hcnkoXG4gICAgbWluRGF0ZTogJG1pbkRhdGVcbiAgICBtYXhEYXRlOiAkbWF4RGF0ZVxuICAgIGlkOiAkaWRcbiAgICB0eXBlOiAkdHlwZVxuICApIHtcbiAgICBza1xuICAgIHNwZW5kaW5nXG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRTcGVuZGluZ1N1bW1hcnlRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0U3BlbmRpbmdTdW1tYXJ5UXVlcnlcbj47XG4iXX0=