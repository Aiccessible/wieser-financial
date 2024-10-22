/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

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

export type ChatQuery = {
  prompt?: string | null,
  chatFocus?: ChatFocus | null,
};

export enum ChatFocus {
  All = "All",
  Investment = "Investment",
  Transaction = "Transaction",
  Accounts = "Accounts",
  Tax = "Tax",
}


export type Recommendation = {
  __typename: "Recommendation",
  explanation?: string | null,
  action?: RecommendationAction | null,
  title?: string | null,
  priority?: string | null,
};

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

export type ChatResponse = {
  __typename: "ChatResponse",
  response?: string | null,
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
    } | null,
    mask?: string | null,
  } >,
};

export type GetTransactionsQueryVariables = {
  id: string,
  limit?: number | null,
  cursor?: string | null,
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

export type GetRecommentdationsQueryVariables = {
  chat?: ChatQuery | null,
};

export type GetRecommentdationsQuery = {
  getRecommentdations:  Array< {
    __typename: "Recommendation",
    explanation?: string | null,
    action?:  {
      __typename: "RecommendationAction",
      transfers?:  Array< {
        __typename: "Transfer",
        fromAccountName?: string | null,
        toAccountName?: string | null,
        amount?: string | null,
      } | null > | null,
      description?: string | null,
    } | null,
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
