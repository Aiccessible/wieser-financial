import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
    __generatedMutationInput: InputType;
    __generatedMutationOutput: OutputType;
};
export declare const createAnalysis: GeneratedMutation<APITypes.CreateAnalysisMutationVariables, APITypes.CreateAnalysisMutation>;
export declare const createAnalysisField: GeneratedMutation<APITypes.CreateAnalysisFieldMutationVariables, APITypes.CreateAnalysisFieldMutation>;
export declare const createChat: GeneratedMutation<APITypes.CreateChatMutationVariables, APITypes.CreateChatMutation>;
export declare const createBudget: GeneratedMutation<APITypes.CreateBudgetMutationVariables, APITypes.CreateBudgetMutation>;
export {};
