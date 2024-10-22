import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
    __generatedQueryInput: InputType;
    __generatedQueryOutput: OutputType;
};
export declare const getItems: GeneratedQuery<APITypes.GetItemsQueryVariables, APITypes.GetItemsQuery>;
export declare const getAccounts: GeneratedQuery<APITypes.GetAccountsQueryVariables, APITypes.GetAccountsQuery>;
export declare const getTransactions: GeneratedQuery<APITypes.GetTransactionsQueryVariables, APITypes.GetTransactionsQuery>;
export declare const getInvestments: GeneratedQuery<APITypes.GetInvestmentsQueryVariables, APITypes.GetInvestmentsQuery>;
export declare const getRecommentdations: GeneratedQuery<APITypes.GetRecommentdationsQueryVariables, APITypes.GetRecommentdationsQuery>;
export declare const getFinancialConversationResponse: GeneratedQuery<APITypes.GetFinancialConversationResponseQueryVariables, APITypes.GetFinancialConversationResponseQuery>;
export {};
