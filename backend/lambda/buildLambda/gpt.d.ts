import OpenAI from 'openai';
import { ChatFocus } from './API';
export interface Transfer {
    fromAccountName: string;
    toAccountName: string;
    amount: string;
}
interface RecommendationAction {
    transfers: Transfer[];
    description: string;
}
export interface Recommendation {
    explanation: string;
    action: RecommendationAction;
    title: string;
    priority: number;
}
export declare const apiClient: OpenAI;
export declare const getFinancialRecommendationsFromData: (prompt: string) => Promise<OpenAI.Chat.Completions.ChatCompletionMessage>;
export declare const completeChatFromPrompt: (prompt: string, type: ChatFocus | null | undefined) => Promise<OpenAI.Chat.Completions.ChatCompletionMessage>;
export declare enum InformationOptions {
    'INVESTMENTS' = 0,
    'TRANSACTIONS' = 1,
    'BANKACCOUNTS' = 2
}
export interface GptDateResponse {
    day: number;
    month: number;
    year: number;
}
export interface DataRangeResponse {
    startDay: GptDateResponse;
    endDay: GptDateResponse;
    hasNoTimeConstraint: boolean;
}
export interface InformationOptionsResponse {
    optionsForInformation: InformationOptions[];
}
export declare const getDateRangeFromModel: (prompt: string) => Promise<OpenAI.Chat.Completions.ChatCompletionMessage>;
export declare const getNeededInformationFromModel: (prompt: string) => Promise<OpenAI.Chat.Completions.ChatCompletionMessage>;
export declare const getTechnicalWordsWhereWeCanGoDeeper: (prompt: string) => Promise<string[]>;
export declare const createAssistant: () => Promise<OpenAI.Beta.Assistants.Assistant & {
    _request_id?: string | null | undefined;
}>;
export declare const uploadFileToAssistant: (file: File) => Promise<OpenAI.Files.FileObject & {
    _request_id?: string | null | undefined;
}>;
export declare const codeInterperterForAnalysis: (fileIds: string[], assistant_id: string, prompt: string) => Promise<OpenAI.Beta.Threads.Thread & {
    _request_id?: string | null | undefined;
}>;
export declare const runThread: (threadId: string, assistant_id: string) => Promise<OpenAI.Beta.Threads.Runs.Run>;
export declare const listMessagesForThread: (threadId: string) => Promise<OpenAI.Beta.Threads.Messages.MessagesPage>;
export {};
