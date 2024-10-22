import { AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatQuery, ChatResponse } from './API'
import { completeChatFromPrompt } from './gpt'

export const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse> = async (
    event: AppSyncResolverEvent<ChatQuery>,
    context: Context
) => {
    const response = await completeChatFromPrompt(event.arguments.prompt || '', event.arguments.chatFocus)
    return {
        response: response.content || '',
        __typename: 'ChatResponse',
    }
}
