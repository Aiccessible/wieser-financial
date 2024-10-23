import { QueryCommand } from '@aws-sdk/client-dynamodb'
import { DataRangeResponse, GptDateResponse, InformationOptions } from '../gpt'
import { EntityName } from '../getResponseUsingFinancialContext'

export interface EntityQueryParams {
    username: string
    id: string
    dateRange: DataRangeResponse | undefined
    entityName: string
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
            ':pk': { S: `USER#${params.username}#ITEM#${params.id}` },
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
