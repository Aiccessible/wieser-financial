import { AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatQuery, ChatResponse } from './API'
import {
    DataRangeResponse,
    InformationOptions,
    InformationOptionsResponse,
    completeChatFromPrompt,
    getDateRangeFromModel,
    getNeededInformationFromModel,
} from './gpt'
import { DynamoDBClient, QueryCommand, QueryCommandOutput } from '@aws-sdk/client-dynamodb'
import { GetEntities } from './queries/Entities'
import { mapJointDataToChatInput, mapSecuritiesToJoinedData } from './mappers/Security'
import { mapAccountToChatInput, mapDynamoDBToAccount } from './mappers/Accounts'
import { mapDynamoDBToTransaction, mapTransactionToChatInput } from './mappers/Transactions'
const client = new DynamoDBClient({ region: 'ca-central-1' })

const dateSupportedFiltering = ['TRANSACTION']
export const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse> = async (
    event: AppSyncResolverEvent<{ chat: ChatQuery }>,
    context: Context
) => {
    console.debug('Get response for', event)
    const informationNeeded = getNeededInformationFromModel(event.arguments.chat.prompt || '')
    const dateRange = getDateRangeFromModel(event.arguments.chat.prompt || '')
    await Promise.all([informationNeeded, dateRange])
    const neededInfo: InformationOptionsResponse = JSON.parse((await informationNeeded).content || '')
    const dateRangeResponse: DataRangeResponse = JSON.parse((await dateRange).content || '')
    console.info('Needed info ', neededInfo)
    console.info('Date range: ', dateRangeResponse)
    const user = context.identity?.cognitoIdentityId
    let tupleOfTypeToElements: [InformationOptions, QueryCommandOutput][]
    tupleOfTypeToElements = await Promise.all(
        neededInfo.informationOptions.map(async (option) => {
            return [
                option,
                await client.send(
                    GetEntities({
                        username: user || '',
                        id: (event.arguments.chat as any).id,
                        dateRange: option in dateSupportedFiltering ? dateRangeResponse : undefined,
                        entityName: option,
                    })
                ),
            ]
        })
    )
    const ddbResponses = tupleOfTypeToElements.map((tuple) => {
        if (tuple[0] === InformationOptions.SECURITY) {
            const mappedData = mapSecuritiesToJoinedData(tuple[1].Items ?? [])
            return '\nInvestments:\n' + mapJointDataToChatInput(mappedData)
        } else if (tuple[0] === InformationOptions.TRANSACTION) {
            return (
                '\nTranasactions:\n' +
                (tuple[1].Items ?? []).map(mapDynamoDBToTransaction).map(mapTransactionToChatInput).join('')
            )
        } else if (tuple[0] === InformationOptions.ACCOUNT) {
            return (
                '\nAccounts:\n' + (tuple[1].Items ?? []).map(mapDynamoDBToAccount).map(mapAccountToChatInput).join('')
            )
        } else {
            throw new Error('UNRECOGNIZED OPTION ' + tuple[0])
        }
    })
    const ragData = ddbResponses.join('')
    console.info('FINAL RAG DATA: ', ragData)
    const { prompt } = event.arguments.chat
    const response = await completeChatFromPrompt(
        prompt + ' Use this data for your answer: ' + ragData || '',
        event.arguments.chat.chatFocus
    )
    return {
        response: response.content || '',
        __typename: 'ChatResponse',
    }
}
