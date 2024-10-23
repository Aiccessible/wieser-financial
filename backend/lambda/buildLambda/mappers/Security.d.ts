import { AttributeValue } from 'aws-sdk/clients/dynamodb';
import { Holding, Security } from '../API';
export declare function mapDynamoDBToSecurityDetails(item: {
    [key: string]: AttributeValue;
}): Security;
type JoinedSecurityData = Record<string, {
    security: Security | undefined;
    holding: Holding;
}>;
export declare function mapSecuritiesToJoinedData(items: {
    [key: string]: AttributeValue;
}[]): JoinedSecurityData;
export declare const mapJointDataToChatInput: (jointData: JoinedSecurityData) => string;
export declare const mapHoldingsAndSecuritiesToJointData: (holdings: (Holding | Security)[]) => JoinedSecurityData;
export {};
