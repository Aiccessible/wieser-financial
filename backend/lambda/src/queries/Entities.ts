import { QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DataRangeResponse, GptDateResponse } from '../gpt'

export interface EntityQueryParams {
    username: string
    id: string
    dateRange: DataRangeResponse | undefined
    entityName: string
    pk?: string | undefined
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
    const filter: any = {
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
            ':pk': { S: params.pk ?? `USER#${params.username}#ITEM#${params.id}` },
            ':sk': { S: `${params.entityName}` },
        },
    }
    if (params.dateRange && !params.dateRange.hasNoTimeConstraint) {
        filter['FilterExpression'] = '#date BETWEEN :startDate AND :endDate'
        filter['ExpressionAttributeValues'][':startDate'] = { S: mapStartDayToDate(params.dateRange.startDay) }
        filter['ExpressionAttributeValues'][':endDate'] = { S: mapStartDayToDate(params.dateRange.endDay) }
    }
    console.info(params)
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
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
            ':pk': { S: id },
        },
    }
    return new QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    })
}
