import { AttributeValue } from 'aws-sdk/clients/dynamodb' // This is the format used by DynamoDB for attributes

interface InvestmentTransaction {
    accountId: string
    amount: number
    cancelTransactionId: string | null
    date: string
    fees: number
    investmentTransactionId: string
    isoCurrencyCode: string
    name: string
    price: number
    quantity: number
    securityId: string
    subtype: string
    type: string
    unofficialCurrencyCode: string | null
}

// DynamoDB Mapper Function
function mapDynamoDBToInvestmentTransaction(item: { [key: string]: AttributeValue }): InvestmentTransaction {
    return {
        accountId: item.account_id.S!, // DynamoDB string type
        amount: parseFloat(item.amount.N!), // DynamoDB number type
        cancelTransactionId: item.cancel_transaction_id?.S || null, // DynamoDB string type or null
        date: item.date.S || '',
        fees: parseFloat(item.fees.N || '0'),
        investmentTransactionId: item.investment_transaction_id.S || '',
        isoCurrencyCode: item.iso_currency_code.S || '',
        name: item.name.S || '',
        price: parseFloat(item.price.N || ''),
        quantity: parseFloat(item.quantity.N || ''),
        securityId: item.security_id.S || '',
        subtype: item.subtype.S || '',
        type: item.type.S || '',
        unofficialCurrencyCode: item.unofficial_currency_code?.S || null,
    }
}
