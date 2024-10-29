import { AttributeValue } from 'aws-sdk/clients/dynamodb' // This is the format used by DynamoDB for attributes
import { Item } from '../API'
import { any } from 'zod'

// DynamoDB Mapper Function
export function mapDdbResponseToItem(item: { [key: string]: AttributeValue }): Item {
    return {
        sk: item.sk?.S, // DynamoDB string type
        item_id: item.item_id?.S ?? '',
        institution_id: item.institution_id?.S ?? '',
        institution_name: item.institution_name?.S ?? '',
        created_at: item.created_at?.S ?? '',
        pk: item.pk?.S ?? '',
        __typename: 'Item',
    }
}
