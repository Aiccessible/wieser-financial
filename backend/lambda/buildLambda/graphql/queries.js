"use strict";
/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialConversationResponse = exports.getRecommentdations = exports.getInvestments = exports.getTransactions = exports.getAccounts = exports.getItems = void 0;
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
exports.getRecommentdations = `query GetRecommentdations($chat: ChatQuery) {
  getRecommentdations(chat: $chat) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ncmFwaHFsL3F1ZXJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsMkRBQTJEOzs7QUFROUMsUUFBQSxRQUFRLEdBQWlCOzs7Ozs7Ozs7Ozs7Q0FZc0MsQ0FBQztBQUNoRSxRQUFBLFdBQVcsR0FBaUI7Ozs7Ozs7Ozs7Ozs7OztDQWtCeEMsQ0FBQztBQUNXLFFBQUEsZUFBZSxHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQjVDLENBQUM7QUFDVyxRQUFBLGNBQWMsR0FBaUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpRDNDLENBQUM7QUFDVyxRQUFBLG1CQUFtQixHQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUJoRCxDQUFDO0FBQ1csUUFBQSxnQ0FBZ0MsR0FBaUI7Ozs7OztDQVM3RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG4vLyB0aGlzIGlzIGFuIGF1dG8gZ2VuZXJhdGVkIGZpbGUuIFRoaXMgd2lsbCBiZSBvdmVyd3JpdHRlblxuXG5pbXBvcnQgKiBhcyBBUElUeXBlcyBmcm9tIFwiLi4vQVBJXCI7XG50eXBlIEdlbmVyYXRlZFF1ZXJ5PElucHV0VHlwZSwgT3V0cHV0VHlwZT4gPSBzdHJpbmcgJiB7XG4gIF9fZ2VuZXJhdGVkUXVlcnlJbnB1dDogSW5wdXRUeXBlO1xuICBfX2dlbmVyYXRlZFF1ZXJ5T3V0cHV0OiBPdXRwdXRUeXBlO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldEl0ZW1zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0SXRlbXMoJGxpbWl0OiBJbnQsICRjdXJzb3I6IFN0cmluZykge1xuICBnZXRJdGVtcyhsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICBpdGVtcyB7XG4gICAgICBpdGVtX2lkXG4gICAgICBpbnN0aXR1dGlvbl9pZFxuICAgICAgaW5zdGl0dXRpb25fbmFtZVxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8QVBJVHlwZXMuR2V0SXRlbXNRdWVyeVZhcmlhYmxlcywgQVBJVHlwZXMuR2V0SXRlbXNRdWVyeT47XG5leHBvcnQgY29uc3QgZ2V0QWNjb3VudHMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRBY2NvdW50cygkaWQ6IElEISkge1xuICBnZXRBY2NvdW50cyhpZDogJGlkKSB7XG4gICAgYWNjb3VudF9pZFxuICAgIHR5cGVcbiAgICBuYW1lXG4gICAgc3VidHlwZVxuICAgIGJhbGFuY2VzIHtcbiAgICAgIGN1cnJlbnRcbiAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICBfX3R5cGVuYW1lXG4gICAgfVxuICAgIG1hc2tcbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldEFjY291bnRzUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldEFjY291bnRzUXVlcnlcbj47XG5leHBvcnQgY29uc3QgZ2V0VHJhbnNhY3Rpb25zID0gLyogR3JhcGhRTCAqLyBgcXVlcnkgR2V0VHJhbnNhY3Rpb25zKCRpZDogSUQhLCAkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldFRyYW5zYWN0aW9ucyhpZDogJGlkLCBsaW1pdDogJGxpbWl0LCBjdXJzb3I6ICRjdXJzb3IpIHtcbiAgICBjdXJzb3JcbiAgICB0cmFuc2FjdGlvbnMge1xuICAgICAgdHJhbnNhY3Rpb25faWRcbiAgICAgIGFjY291bnRfaWRcbiAgICAgIGFtb3VudFxuICAgICAgbmFtZVxuICAgICAgaXNvX2N1cnJlbmN5X2NvZGVcbiAgICAgIGRhdGVcbiAgICAgIHBheW1lbnRfY2hhbm5lbFxuICAgICAgdHJhbnNhY3Rpb25fdHlwZVxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICBfX3R5cGVuYW1lXG4gIH1cbn1cbmAgYXMgR2VuZXJhdGVkUXVlcnk8XG4gIEFQSVR5cGVzLkdldFRyYW5zYWN0aW9uc1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRUcmFuc2FjdGlvbnNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRJbnZlc3RtZW50cyA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEludmVzdG1lbnRzKCRpZDogSUQhLCAkbGltaXQ6IEludCwgJGN1cnNvcjogU3RyaW5nKSB7XG4gIGdldEludmVzdG1lbnRzKGlkOiAkaWQsIGxpbWl0OiAkbGltaXQsIGN1cnNvcjogJGN1cnNvcikge1xuICAgIGN1cnNvclxuICAgIHRyYW5zYWN0aW9ucyB7XG4gICAgICAuLi4gb24gSG9sZGluZyB7XG4gICAgICAgIGFjY291bnRfaWRcbiAgICAgICAgY29zdF9iYXNpc1xuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZVxuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZV9hc19vZlxuICAgICAgICBpbnN0aXR1dGlvbl9wcmljZV9kYXRldGltZVxuICAgICAgICBpbnN0aXR1dGlvbl92YWx1ZVxuICAgICAgICBpc29fY3VycmVuY3lfY29kZVxuICAgICAgICBxdWFudGl0eVxuICAgICAgICBzZWN1cml0eV9pZFxuICAgICAgICB1bm9mZmljaWFsX2N1cnJlbmN5X2NvZGVcbiAgICAgICAgcGxhaWRfdHlwZVxuICAgICAgfVxuICAgICAgLi4uIG9uIFNlY3VyaXR5IHtcbiAgICAgICAgY2xvc2VfcHJpY2VcbiAgICAgICAgYWNjb3VudF9pZFxuICAgICAgICBjbG9zZV9wcmljZV9hc19vZlxuICAgICAgICBjb3N0X2Jhc2lzXG4gICAgICAgIGN1c2lwXG4gICAgICAgIGluc3RpdHV0aW9uX2lkXG4gICAgICAgIGluc3RpdHV0aW9uX3NlY3VyaXR5X2lkXG4gICAgICAgIGlzX2Nhc2hfZXF1aXZhbGVudFxuICAgICAgICBpc2luXG4gICAgICAgIGlzb19jdXJyZW5jeV9jb2RlXG4gICAgICAgIG5hbWVcbiAgICAgICAgcHJveHlfc2VjdXJpdHlfaWRcbiAgICAgICAgc2VjdXJpdHlfaWRcbiAgICAgICAgc2Vkb2xcbiAgICAgICAgdGlja2VyX3N5bWJvbFxuICAgICAgICB0eXBlXG4gICAgICAgIHVub2ZmaWNpYWxfY3VycmVuY3lfY29kZVxuICAgICAgICB1cGRhdGVfZGF0ZXRpbWVcbiAgICAgICAgbWFya2V0X2lkZW50aWZpZXJfY29kZVxuICAgICAgICBzZWN0b3JcbiAgICAgICAgaW5kdXN0cnlcbiAgICAgICAgb3B0aW9uX2NvbnRyYWN0XG4gICAgICAgIHBsYWlkX3R5cGVcbiAgICAgIH1cbiAgICB9XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRJbnZlc3RtZW50c1F1ZXJ5VmFyaWFibGVzLFxuICBBUElUeXBlcy5HZXRJbnZlc3RtZW50c1F1ZXJ5XG4+O1xuZXhwb3J0IGNvbnN0IGdldFJlY29tbWVudGRhdGlvbnMgPSAvKiBHcmFwaFFMICovIGBxdWVyeSBHZXRSZWNvbW1lbnRkYXRpb25zKCRjaGF0OiBDaGF0UXVlcnkpIHtcbiAgZ2V0UmVjb21tZW50ZGF0aW9ucyhjaGF0OiAkY2hhdCkge1xuICAgIGV4cGxhbmF0aW9uXG4gICAgYWN0aW9uIHtcbiAgICAgIHRyYW5zZmVycyB7XG4gICAgICAgIGZyb21BY2NvdW50TmFtZVxuICAgICAgICB0b0FjY291bnROYW1lXG4gICAgICAgIGFtb3VudFxuICAgICAgICBfX3R5cGVuYW1lXG4gICAgICB9XG4gICAgICBkZXNjcmlwdGlvblxuICAgICAgX190eXBlbmFtZVxuICAgIH1cbiAgICB0aXRsZVxuICAgIHByaW9yaXR5XG4gICAgX190eXBlbmFtZVxuICB9XG59XG5gIGFzIEdlbmVyYXRlZFF1ZXJ5PFxuICBBUElUeXBlcy5HZXRSZWNvbW1lbnRkYXRpb25zUXVlcnlWYXJpYWJsZXMsXG4gIEFQSVR5cGVzLkdldFJlY29tbWVudGRhdGlvbnNRdWVyeVxuPjtcbmV4cG9ydCBjb25zdCBnZXRGaW5hbmNpYWxDb252ZXJzYXRpb25SZXNwb25zZSA9IC8qIEdyYXBoUUwgKi8gYHF1ZXJ5IEdldEZpbmFuY2lhbENvbnZlcnNhdGlvblJlc3BvbnNlKCRjaGF0OiBDaGF0UXVlcnkpIHtcbiAgZ2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2UoY2hhdDogJGNoYXQpIHtcbiAgICByZXNwb25zZVxuICAgIF9fdHlwZW5hbWVcbiAgfVxufVxuYCBhcyBHZW5lcmF0ZWRRdWVyeTxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2VRdWVyeVZhcmlhYmxlcyxcbiAgQVBJVHlwZXMuR2V0RmluYW5jaWFsQ29udmVyc2F0aW9uUmVzcG9uc2VRdWVyeVxuPjtcbiJdfQ==