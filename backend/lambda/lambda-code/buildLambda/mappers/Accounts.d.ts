import { AttributeValue } from 'aws-sdk/clients/dynamodb';
import { Account } from '../API';
export declare function mapDynamoDBToAccount(item: {
    [key: string]: AttributeValue;
}): Account;
export declare const mapAccountToChatInput: (account: Account) => string;
