import { AppSyncIdentityCognito, AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatFocus, ChatQuery, ChatResponse, ChatType, CacheType } from './API'
import { InformationOptions, completeChatFromPrompt, getDateRangeFromModel, getNeededInformationFromModel } from './gpt'
import { DynamoDBClient, QueryCommandOutput } from '@aws-sdk/client-dynamodb'
import { GetCacheEntity, GetEntities, PutCacheEntity } from './queries/Entities'
import { mapJointDataToChatInput, mapSecuritiesToJoinedData } from './mappers/Security'
import { mapAccountToChatInput, mapDynamoDBToAccount } from './mappers/Accounts'
import { mapDynamoDBToTransaction, mapTransactionToChatInput } from './mappers/Transactions'
import { mapDdbResponseToCacheEntity } from './mappers/CacheEntity'
import { decryptItemsInBatches } from './queries/Encryption'
const client = new DynamoDBClient({ region: 'ca-central-1' })

const dateSupportedFiltering = ['TRANSACTION']
export type EntityName = 'SECURITY' | 'TRANSACTION' | 'ACCOUNT'
const mapOfInformationOptionToKey: Record<string, EntityName> = {
    BANKACCOUNTS: 'ACCOUNT',
    INVESTMENTS: 'SECURITY',
    TRANSACTIONS: 'TRANSACTION',
}

const mapOfCacheTypeToExpiry: Record<CacheType, number> = {
    [CacheType.InvestmentAnalysis]: 60 * 60 * 1000,
    [CacheType.PortfolioAnalysis]: 60 * 60 * 1000 * 24,
    [CacheType.StockAnalysis]: 60 * 60 * 1000 * 24,
    [CacheType.StockNews]: 60 * 60 * 1000,
}

export const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse> = async (
    event: AppSyncResolverEvent<{ chat: ChatQuery }>,
    context: Context
) => {
    console.info('Get response for', event)
    let neededInfo: { optionsForInformation: InformationOptions[] } = { optionsForInformation: [] }
    let dateRangeResponse: any
    if (event.arguments.chat.shouldRagFetch) {
        const informationNeeded = getNeededInformationFromModel(event.arguments.chat.prompt || '')
        const dateRange = getDateRangeFromModel(event.arguments.chat.prompt || '')
        await Promise.all([informationNeeded, dateRange])
        neededInfo = JSON.parse((await informationNeeded).content || '')
        dateRangeResponse = JSON.parse((await dateRange).content || '')
    }

    if (event.arguments.chat.cacheIdentifiers) {
        const cacheChecks = await Promise.all(
            event.arguments.chat.cacheIdentifiers.map((id) => {
                return client.send(
                    GetCacheEntity({
                        id: id.key || '',
                        expiresAt: mapOfCacheTypeToExpiry[id.cacheType!] + Date.now(),
                    })
                )
            })
        )
        const itemHits = cacheChecks.flatMap((el) => el.Items ?? [])
        if (itemHits.length) {
            return {
                response: itemHits.map(mapDdbResponseToCacheEntity).join('') || '',
                __typename: 'ChatResponse',
            }
        }
    }
    if (
        event.arguments.chat.chatFocus === ChatFocus.Investment &&
        !neededInfo.optionsForInformation.find((el) => el === InformationOptions.INVESTMENTS)
    ) {
        neededInfo.optionsForInformation.push('INVESTMENTS' as any)
    }

    console.info('Context: ', context)
    console.info('Needed info ', neededInfo)
    console.info('Date range: ', dateRangeResponse)
    const user = (event.identity as AppSyncIdentityCognito)?.username
    let tupleOfTypeToElements: [InformationOptions, QueryCommandOutput][]
    tupleOfTypeToElements = await Promise.all(
        neededInfo.optionsForInformation.map(async (option) => {
            const entityName = mapOfInformationOptionToKey[option].toString()
            return [
                option,
                await client.send(
                    GetEntities({
                        username: user || '',
                        id: event.arguments.chat.accountId || '',
                        dateRange: entityName in dateSupportedFiltering ? dateRangeResponse : undefined,
                        entityName: entityName,
                    })
                ),
            ]
        })
    )

    /** Get the contextual data */
    const ddbResponses = await Promise.all(
        tupleOfTypeToElements.map(async (tuple) => {
            const decryptedItems = await decryptItemsInBatches(tuple[1]?.Items ?? [])
            if (tuple[0].toString() === 'INVESTMENTS') {
                const mappedData = await mapSecuritiesToJoinedData(decryptedItems)
                return '\nInvestments:\n' + mapJointDataToChatInput(mappedData)
            } else if (tuple[0].toString() === 'TRANSACTIONS') {
                return (
                    '\nTranasactions:\n' +
                    decryptedItems.map(mapDynamoDBToTransaction).map(mapTransactionToChatInput).join('')
                )
            } else if (tuple[0].toString() === 'BANKACCOUNTS') {
                return '\nAccounts:\n' + decryptedItems.map(mapDynamoDBToAccount).map(mapAccountToChatInput).join('')
            } else {
                throw new Error('UNRECOGNIZED OPTION ' + tuple[0])
            }
        })
    )
    const ragData = ddbResponses.join('')
    console.info('FINAL RAG DATA: ', ragData)
    const { prompt } = event.arguments.chat
    const response = await completeChatFromPrompt(
        prompt + ' Use this data for your answer: ' + ragData || '',
        event.arguments.chat.chatFocus,
        user,
        event.arguments.chat.requiresLiveData ?? false,
        event.arguments.chat.chatType ?? ChatType.Regular
    )
    event.arguments.chat.cacheIdentifiers?.map((id) => {
        client.send(
            PutCacheEntity(
                {
                    id: id.key || '',
                    expiresAt: mapOfCacheTypeToExpiry[id.cacheType!] + Date.now(),
                },
                {}
            )
        )
    })
    return {
        response: response || '',
        __typename: 'ChatResponse',
    }
}
