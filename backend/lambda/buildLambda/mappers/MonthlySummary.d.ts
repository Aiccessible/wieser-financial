import { AttributeValue } from 'aws-sdk/clients/dynamodb';
import { SpendingSummary } from '../API';
export declare function mapDynamoDBToMonthlySummary(item: {
    [key: string]: AttributeValue;
}): SpendingSummary;
export declare const mapSpendingSummaryToChatInput: (summary: SpendingSummary) => string;
