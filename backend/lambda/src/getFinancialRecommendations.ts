import { AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatQuery, Recommendation } from './API'
import { getFinancialRecommendationsFromData } from './gpt'

export const getFinancialRecommendations: AppSyncResolverHandler<any, Recommendation[]> = async (
    event: AppSyncResolverEvent<{ chat: ChatQuery }>,
    context: Context
) => {
    console.debug('Sending prompt', event.arguments.chat.prompt)
    const response = await getFinancialRecommendationsFromData(event.arguments.chat.prompt || '')
    const recommentations = JSON.parse(response.content || '')
    console.debug('Got', recommentations, ' From GPT')
    return recommentations.recommendations.map((el: Recommendation) => ({ ...el, __typename: 'Recommendation' }))
}
