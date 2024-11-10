import { AppSyncIdentityCognito, AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatFocus, ChatQuery, ChatResponse, ChatType, CacheType, CacheIdentifer } from './API'
import { InformationOptions, completeChatFromPrompt, getDateRangeFromModel, getNeededInformationFromModel } from './gpt'
import { DynamoDBClient, QueryCommandOutput } from '@aws-sdk/client-dynamodb'
import { GetCacheEntity, GetEntities, PutCacheEntity } from './queries/Entities'
import { mapJointDataToChatInput, mapSecuritiesToJoinedData } from './mappers/Security'
import { mapAccountToChatInput, mapDynamoDBToAccount } from './mappers/Accounts'
import { mapDynamoDBToTransaction, mapTransactionToChatInput } from './mappers/Transactions'
import { mapDdbResponseToCacheEntity } from './mappers/CacheEntity'
import { decryptItemsInBatches } from './queries/Encryption'
import { mapDynamoDBToMonthlySummary, mapSpendingSummaryToChatInput } from './mappers/MonthlySummary'
const client = new DynamoDBClient({ region: 'ca-central-1' })

const dateSupportedFiltering = ['TRANSACTION', 'MONTHLYSUMMARY']
export type EntityName = 'SECURITY' | 'TRANSACTION' | 'ACCOUNT' | 'MONTHLYSUMMARY'
const mapOfInformationOptionToKey: Record<string, EntityName> = {
    ACCOUNTS: 'ACCOUNT',
    INVESTMENTS: 'SECURITY',
    TRANSACTIONS: 'TRANSACTION',
    MONTHLYSUMMARY: 'MONTHLYSUMMARY',
}

const mapOfCacheTypeToExpiry: Record<CacheType, number> = {
    [CacheType.InvestmentAnalysis]: 60 * 60 * 1000 * 4,
    [CacheType.PortfolioAnalysis]: 60 * 60 * 1000 * 24,
    [CacheType.StockAnalysis]: 60 * 60 * 1000 * 24,
    [CacheType.StockNews]: 60 * 60 * 1000 * 4,
    [CacheType.TransactionRecommendation]: 60 * 60 * 1000 * 24 * 5,
    [CacheType.GeneralRecommendation]: 60 * 60 * 1000 * 24,
}

export const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse> = async (
    event: AppSyncResolverEvent<{ chat: ChatQuery }>,
    context: Context
) => {
    const user = (event.identity as AppSyncIdentityCognito)?.username
    console.info('Get response for', event)
    const maxAccounts = event.arguments.chat.accountIds?.slice(0, 10) ?? []
    let neededInfo: { optionsForInformation: InformationOptions[] } = { optionsForInformation: [] }
    let dateRangeResponse: any
    if (
        !event.arguments.chat.doNotUseAdvancedRag &&
        !(event.arguments.chat.currentDateRange && event.arguments.chat.highLevelCategory) &&
        !event.arguments.chat.doNotUseAdvancedRag
    ) {
        const informationNeeded = getNeededInformationFromModel(event.arguments.chat.prompt || '')
        const dateRange = getDateRangeFromModel(event.arguments.chat.prompt || '')
        await Promise.all([informationNeeded, dateRange])
        neededInfo = JSON.parse((await informationNeeded).content || '')
        dateRangeResponse = JSON.parse((await dateRange).content || '')
    }

    if (event.arguments.chat.cacheIdentifiers) {
        const cacheChecks = await Promise.all(
            event.arguments.chat.cacheIdentifiers.map((id) => {
                let cacheKey = getCacheKey(user, id)

                return client.send(
                    GetCacheEntity({
                        id: cacheKey || '',
                        sk: id.cacheType?.toString() ?? '',
                        expire_at: Date.now(),
                    })
                )
            })
        )
        const itemHits = cacheChecks.flatMap((el) => el.Items ?? [])
        if (itemHits.length) {
            return {
                response:
                    itemHits
                        .map(mapDdbResponseToCacheEntity)
                        ?.map((el) => el.response)
                        .join('') || '',
                __typename: 'ChatResponse',
            }
        }
    }
    if (
        event.arguments.chat.chatFocus === ChatFocus.Investment &&
        !neededInfo.optionsForInformation.find((el) => el === InformationOptions.INVESTMENTS)
    ) {
        neededInfo.optionsForInformation.push('INVESTMENTS' as any)
    } else if (
        (event.arguments.chat.chatFocus === ChatFocus.Transaction ||
            event.arguments.chat.chatType === ChatType.TransactionRecommendation) &&
        !neededInfo.optionsForInformation.find((el) => el === InformationOptions.TRANSACTIONS)
    ) {
        neededInfo.optionsForInformation.push('TRANSACTIONS' as any)
    }

    if (event.arguments.chat.chatType === ChatType.GeneralRecommendation) {
        neededInfo.optionsForInformation = ['INVESTMENTS' as any, 'ACCOUNTS' as any, 'MONTHLYSUMMARY' as any]
    }

    if (neededInfo.optionsForInformation?.length === 0) {
        neededInfo.optionsForInformation = ['ACCOUNTS' as any, 'MONTHLYSUMMARY' as any]
    }

    console.info('Context: ', context)
    console.info('Needed info ', neededInfo)
    console.info('Date range: ', dateRangeResponse)
    let tupleOfTypeToElements: [InformationOptions, QueryCommandOutput][]
    tupleOfTypeToElements = (
        await Promise.all(
            neededInfo.optionsForInformation.map(async (option) => {
                const entityName = mapOfInformationOptionToKey[option].toString()
                return await Promise.all(
                    entityName !== 'MONTHLYSUMMARY'
                        ? maxAccounts?.map(async (accountId) => {
                              return [
                                  option,
                                  await client.send(
                                      GetEntities({
                                          username: user || '',
                                          id: accountId || '',
                                          dateRange: dateSupportedFiltering.find((el) => el === entityName)
                                              ? dateRangeResponse
                                              : undefined,
                                          entityName: entityName,
                                          customDateRange: dateSupportedFiltering.find((el) => el === entityName)
                                              ? (event.arguments.chat?.currentDateRange?.map((el) =>
                                                    el ? parseInt(el) : undefined
                                                ) as any) ?? undefined
                                              : undefined,
                                          highLevelCategory: event.arguments.chat.highLevelCategory ?? undefined,
                                      })
                                  ),
                              ]
                          }) ?? [option, undefined]
                        : [
                              [
                                  option,
                                  await client.send(
                                      GetEntities({
                                          username: user || '',
                                          id: 'v0',
                                          dateRange: dateSupportedFiltering.find((el) => el === entityName)
                                              ? dateRangeResponse
                                              : undefined,
                                          entityName: entityName,
                                          customDateRange: undefined,
                                          highLevelCategory: event.arguments.chat.highLevelCategory ?? undefined,
                                      })
                                  ),
                              ],
                          ]
                )
            })
        )
    ).flatMap((el: any) => [...el]) as any as [InformationOptions, QueryCommandOutput][]
    console.info(tupleOfTypeToElements, 'good')
    /** Get the contextual data */
    const ddbResponses = await Promise.all(
        tupleOfTypeToElements.map(async (tuple) => {
            await tuple[0]
            const awaitedTuple = tuple
            const decryptedItems = await decryptItemsInBatches(awaitedTuple[1]?.Items ?? [])
            if (awaitedTuple[0].toString() === 'INVESTMENTS') {
                const mappedData = await mapSecuritiesToJoinedData(decryptedItems)
                return '\nInvestments:\n' + mapJointDataToChatInput(mappedData)
            } else if (awaitedTuple[0].toString() === 'TRANSACTIONS') {
                return (
                    '\nTranasactions:\n' +
                    decryptedItems.map(mapDynamoDBToTransaction).map(mapTransactionToChatInput).join('')
                )
            } else if (awaitedTuple[0].toString() === 'ACCOUNTS') {
                return '\nAccounts:\n' + decryptedItems.map(mapDynamoDBToAccount).map(mapAccountToChatInput).join('')
            } else if (awaitedTuple[0].toString() === 'MONTHLYSUMMARY') {
                return (
                    '\nMonthly Spending:\n' +
                    decryptedItems.map(mapDynamoDBToMonthlySummary).map(mapSpendingSummaryToChatInput).join('')
                )
            } else {
                throw new Error('UNRECOGNIZED OPTION ' + awaitedTuple[0])
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
        let cacheKey = getCacheKey(user, id)
        client.send(
            PutCacheEntity(
                {
                    id: cacheKey || '',
                    expire_at: mapOfCacheTypeToExpiry[id.cacheType!] + Date.now(),
                    sk: id.cacheType?.toString() ?? '',
                },
                { response: { S: response } }
            )
        )
    })
    return {
        response: response || '',
        __typename: 'ChatResponse',
    }
}

export const getCacheKey = (user: string, id: CacheIdentifer) => {
    let cacheKey = id.key
    if (
        id.cacheType === CacheType.InvestmentAnalysis ||
        id.cacheType === CacheType.PortfolioAnalysis ||
        id.cacheType === CacheType.TransactionRecommendation ||
        id.cacheType === CacheType.GeneralRecommendation
    ) {
        cacheKey = user + id.key?.slice(0, 100)
    }
    return cacheKey
}
