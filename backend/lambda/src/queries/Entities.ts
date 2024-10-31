import { QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DataRangeResponse, GptDateResponse } from '../gpt'
import { HighLevelTransactionCategory } from '../API'

export interface EntityQueryParams {
    username: string
    id: string
    dateRange: DataRangeResponse | undefined
    customDateRange?: [number?, number?] | null | undefined
    entityName: string
    pk?: string | undefined
    highLevelCategory?: HighLevelTransactionCategory
}

export interface CacheEntityQueryParam {
    id: string
    expiresAt: number
}

function mapStartDayToDate(startDay: GptDateResponse): string {
    const { day, month, year } = startDay

    // Ensure the day and month are two digits by padding them with zeroes
    const formattedDay = String(day).padStart(2, '0')
    const formattedMonth = String(month).padStart(2, '0') // Months should be zero-padded

    // Return the date in 'YYYY-MM-DD' format
    return `${year}-${formattedMonth}-${formattedDay}`
}

// SECURITY and ACCOUNT dont have date range in key
export const GetEntities = (params: EntityQueryParams) => {
    let filter: any = {
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
            ':pk': { S: params.pk ?? `USER#${params.username}#ITEM#${params.id}` },
            ':sk': { S: `${params.entityName}` },
        },
    }
    if (params.dateRange && !params.dateRange.hasNoTimeConstraint) {
        filter = { ...filter, ExpressionAttributeNames: {} }
        filter['FilterExpression'] = '#date BETWEEN :startDate AND :endDate'
        filter['ExpressionAttributeValues'][':startDate'] = { S: mapStartDayToDate(params.dateRange.startDay) }
        filter['ExpressionAttributeValues'][':endDate'] = { S: mapStartDayToDate(params.dateRange.endDay) }
        filter['ExpressionAttributeNames'] = { '#date': 'date' }
    }
    if (params.customDateRange) {
        filter = { ...filter, ExpressionAttributeNames: {} }
        filter['FilterExpression'] = '#date BETWEEN :startDate AND :endDate'
        filter['ExpressionAttributeValues'][':startDate'] = {
            S: params.customDateRange[0] ? new Date(params.customDateRange[0]).toISOString().split('.')[0] : 0,
        }
        filter['ExpressionAttributeValues'][':endDate'] = {
            S: params.customDateRange[1]
                ? new Date(params.customDateRange[1]).toISOString().split('.')[0]
                : new Date().toISOString().split('.')[0],
        }
        filter['ExpressionAttributeNames'] = { '#date': 'date' }
    }
    if (params.highLevelCategory) {
        if (!filter['FilterExpression']) {
            filter['FilterExpression'] = '#finance = :primaryCategory'
        } else {
            filter['FilterExpression'] = filter['FilterExpression'] + ' AND #finance = :primaryCategory'
        }
        filter['ExpressionAttributeValues'][':primaryCategory'] = {
            S: params.highLevelCategory,
        }
        filter['ExpressionAttributeNames'] = {
            ...(filter['ExpressionAttributeNames'] ?? {}),
            '#finance': 'personal_finance_category.primary',
        }
    }
    return new QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    })
}

export const GetCacheEntity = (params: CacheEntityQueryParam) => {
    const filter: any = {
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
            ':pk': { S: `CACHEENTITY#${params.id}` },
        },
    }
    if (params.expiresAt) {
        // Adding the FilterExpression to check if ExpiresAt is less than the provided expiresAt
        filter['FilterExpression'] = '#expiresAt < :expiresAt'
        filter['ExpressionAttributeNames'] = {
            '#expiresAt': 'ExpiresAt', // Using attribute name mapping for ExpiresAt
        }
        filter['ExpressionAttributeValues'][':expiresAt'] = { N: params.expiresAt.toString() } // Assuming expiresAt is a number (timestamp)
    }

    console.info(params)
    return new QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    })
}

export const PutCacheEntity = (params: CacheEntityQueryParam, data: any) => {
    const item: any = {
        pk: `CACHEENTITY#${params.id}`,
        ExpiresAt: params.expiresAt, // Storing ExpiresAt as a number (timestamp)
        ...data, // Spread any additional data attributes
    }

    return new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
    })
}

export const GetItems = () => {
    const filter: any = {
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
            ':pk': { S: `ITEMS` },
        },
    }
    return new QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    })
}

export const GetUser = (id: string) => {
    const filter: any = {
        KeyConditionExpression: 'pk = :pk and sk = :sk',
        ExpressionAttributeValues: {
            ':pk': { S: id },
            ':sk': { S: 'v0' },
        },
    }
    return new QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    })
}
