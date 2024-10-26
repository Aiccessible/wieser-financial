import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
    __generatedMutationInput: InputType;
    __generatedMutationOutput: OutputType;
};
export declare const createChat: GeneratedMutation<APITypes.CreateChatMutationVariables, APITypes.CreateChatMutation>;
export {};
