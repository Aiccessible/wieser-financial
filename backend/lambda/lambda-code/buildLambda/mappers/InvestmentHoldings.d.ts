import { AttributeValue } from 'aws-sdk/clients/dynamodb';
import { Holding } from '../API';
export declare function mapDynamoDBToInvestmentHolding(item: {
    [key: string]: AttributeValue;
}): Holding;
