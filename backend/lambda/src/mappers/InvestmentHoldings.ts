import { AttributeValue } from 'aws-sdk/clients/dynamodb' // This is the format used by DynamoDB for attributes
import { Holding } from '../API'

export function mapDynamoDBToInvestmentHolding(item: { [key: string]: AttributeValue }): Holding {
    return {
        account_id: item.account_id?.S || '', // DynamoDB string type
        cost_basis: parseFloat(item.cost_basis?.N || ''), // DynamoDB number type
        institution_price: parseFloat(item.institution_price?.N || ''),
        institution_price_as_of: item.institution_price_as_of?.S || null, // DynamoDB string type or null
        institution_value: parseFloat(item.institution_value?.N || ''),
        iso_currency_code: item.iso_currency_code?.S || '',
        quantity: parseFloat(item.quantity?.N || ''),
        security_id: item.security_id?.S || '',
        unofficial_currency_code: item.unofficial_currency_code?.S || null,
        plaid_type: item.plaid_type?.S ?? '',
        __typename: 'Holding',
    }
}
