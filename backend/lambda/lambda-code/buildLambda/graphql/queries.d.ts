import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
    __generatedQueryInput: InputType;
    __generatedQueryOutput: OutputType;
};
export declare const retryCodeBuild: GeneratedQuery<APITypes.RetryCodeBuildQueryVariables, APITypes.RetryCodeBuildQuery>;
export declare const getUserAnalysis: GeneratedQuery<APITypes.GetUserAnalysisQueryVariables, APITypes.GetUserAnalysisQuery>;
export declare const getUserAnalysisFields: GeneratedQuery<APITypes.GetUserAnalysisFieldsQueryVariables, APITypes.GetUserAnalysisFieldsQuery>;
export declare const getItems: GeneratedQuery<APITypes.GetItemsQueryVariables, APITypes.GetItemsQuery>;
export declare const getAccounts: GeneratedQuery<APITypes.GetAccountsQueryVariables, APITypes.GetAccountsQuery>;
export declare const getTransactions: GeneratedQuery<APITypes.GetTransactionsQueryVariables, APITypes.GetTransactionsQuery>;
export declare const getInvestments: GeneratedQuery<APITypes.GetInvestmentsQueryVariables, APITypes.GetInvestmentsQuery>;
export declare const getBudgets: GeneratedQuery<APITypes.GetBudgetsQueryVariables, APITypes.GetBudgetsQuery>;
export declare const getFinancialSimulationExpansion: GeneratedQuery<APITypes.GetFinancialSimulationExpansionQueryVariables, APITypes.GetFinancialSimulationExpansionQuery>;
export declare const getFinancialRecommendations: GeneratedQuery<APITypes.GetFinancialRecommendationsQueryVariables, APITypes.GetFinancialRecommendationsQuery>;
export declare const getFinancialConversationResponse: GeneratedQuery<APITypes.GetFinancialConversationResponseQueryVariables, APITypes.GetFinancialConversationResponseQuery>;
export declare const getSpendingSummary: GeneratedQuery<APITypes.GetSpendingSummaryQueryVariables, APITypes.GetSpendingSummaryQuery>;
export declare const getNetWorths: GeneratedQuery<APITypes.GetNetWorthsQueryVariables, APITypes.GetNetWorthsQuery>;
export {};
