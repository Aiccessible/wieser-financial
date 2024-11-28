import { AttributeValue } from 'aws-sdk/clients/dynamodb';
import { Transaction } from '../API';
export declare function mapDynamoDBToTransaction(item: {
    [key: string]: AttributeValue;
}): Transaction;
export declare const mapTransactionToChatInput: (transaction: Transaction) => string;
