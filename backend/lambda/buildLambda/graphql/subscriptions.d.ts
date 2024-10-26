import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
    __generatedSubscriptionInput: InputType;
    __generatedSubscriptionOutput: OutputType;
};
export declare const onCreateChat: GeneratedSubscription<APITypes.OnCreateChatSubscriptionVariables, APITypes.OnCreateChatSubscription>;
export {};
