import { AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatQuery, ChatResponse } from './API'
import { completeChatFromPrompt } from './gpt'

export const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse> = async (
    event: AppSyncResolverEvent<{ chat: ChatQuery }>,
    context: Context
) => {
    console.debug('Get response for', event)
    const response = await completeChatFromPrompt(event.arguments.chat.prompt || '', event.arguments.chat.chatFocus)
    console.debug(response)
    return {
        response: response.content || '',
        __typename: 'ChatResponse',
    }
}
