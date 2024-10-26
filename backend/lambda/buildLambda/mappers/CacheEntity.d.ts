import { AttributeValue } from 'aws-sdk/clients/dynamodb';
interface CacheEntity {
    response: string | undefined;
}
export declare function mapDdbResponseToCacheEntity(item: {
    [key: string]: AttributeValue;
}): CacheEntity;
export {};
