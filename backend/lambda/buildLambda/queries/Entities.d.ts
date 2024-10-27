import { QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DataRangeResponse } from '../gpt';
export interface EntityQueryParams {
    username: string;
    id: string;
    dateRange: DataRangeResponse | undefined;
    entityName: string;
    pk?: string | undefined;
}
export interface CacheEntityQueryParam {
    id: string;
    expiresAt: number;
}
export declare const GetEntities: (params: EntityQueryParams) => QueryCommand;
export declare const GetCacheEntity: (params: CacheEntityQueryParam) => QueryCommand;
export declare const PutCacheEntity: (params: CacheEntityQueryParam, data: any) => PutItemCommand;
export declare const GetItems: () => QueryCommand;
export declare const GetUser: (id: string) => QueryCommand;
