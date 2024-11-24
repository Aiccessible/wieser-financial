/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAnalysis = /* GraphQL */ `mutation CreateAnalysis($analysis: AnalysisInput) {
  createAnalysis(analysis: $analysis) {
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
` as GeneratedMutation<
  APITypes.CreateAnalysisMutationVariables,
  APITypes.CreateAnalysisMutation
>;
export const createAnalysisField = /* GraphQL */ `mutation CreateAnalysisField($analysisField: AnalysisFieldInput) {
  createAnalysisField(analysisField: $analysisField) {
    inputName
    inputValue
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAnalysisFieldMutationVariables,
  APITypes.CreateAnalysisFieldMutation
>;
export const createChat = /* GraphQL */ `mutation CreateChat($chat: ChatInput!) {
  createChat(chat: $chat) {
    pk
    sk
    message
    time
    isLastChunk
    messageId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateChatMutationVariables,
  APITypes.CreateChatMutation
>;
export const createBudget = /* GraphQL */ `mutation CreateBudget($budget: BudgetPlanInput!) {
  createBudget(budget: $budget) {
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
}
` as GeneratedMutation<
  APITypes.CreateBudgetMutationVariables,
  APITypes.CreateBudgetMutation
>;
