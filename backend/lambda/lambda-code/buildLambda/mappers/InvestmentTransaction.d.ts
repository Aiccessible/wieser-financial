import { AttributeValue } from 'aws-sdk/clients/dynamodb';
interface InvestmentTransaction {
    accountId: string;
    amount: number;
    cancelTransactionId: string | null;
    date: string;
    fees: number;
    investmentTransactionId: string;
    isoCurrencyCode: string;
    name: string;
    price: number;
    quantity: number;
    securityId: string;
    subtype: string;
    type: string;
    unofficialCurrencyCode: string | null;
}
export declare function mapDynamoDBToInvestmentTransaction(item: {
    [key: string]: AttributeValue;
}): InvestmentTransaction;
export {};
