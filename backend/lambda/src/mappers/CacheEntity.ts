import { AttributeValue } from 'aws-sdk/clients/dynamodb' // This is the format used by DynamoDB for attributes

interface CacheEntity {
    response: string | undefined
}

// DynamoDB Mapper Function
export function mapDdbResponseToCacheEntity(item: { [key: string]: AttributeValue }): CacheEntity {
    return {
        response: item.response.S, // DynamoDB string type
    }
}
