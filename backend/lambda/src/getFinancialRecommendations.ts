import { AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatQuery, Recommendation } from './API'
import { getFinancialRecommendationsFromData } from './gpt'

export const getFinancialRecommendations: AppSyncResolverHandler<any, Recommendation[]> = async (
    event: AppSyncResolverEvent<ChatQuery>,
    context: Context
) => {
    const response = await getFinancialRecommendationsFromData(event.arguments.prompt || '')
    const recommentations = JSON.parse(response.content || '')
    return recommentations.map((el: Recommendation) => ({ ...el, __typename: 'Recommendation' }))
}
