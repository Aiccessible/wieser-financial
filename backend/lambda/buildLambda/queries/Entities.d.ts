import { QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DataRangeResponse } from '../gpt';
import { HighLevelTransactionCategory } from '../API';
export interface EntityQueryParams {
    username: string;
    id: string;
    dateRange: DataRangeResponse | undefined;
    customDateRange?: [number?, number?] | null | undefined;
    entityName: string;
    pk?: string | undefined;
    highLevelCategory?: HighLevelTransactionCategory;
    getAllTransactionsForUser?: boolean;
    getAllSecuritiesForUser?: boolean;
}
export interface CacheEntityQueryParam {
    id: string;
    expire_at: number;
    sk: string;
}
export declare const detailedCategories: string[];
export declare const GetEntities: (params: EntityQueryParams) => QueryCommand;
export declare const GetCacheEntity: (params: CacheEntityQueryParam) => QueryCommand;
export declare const PutCacheEntity: (params: CacheEntityQueryParam, data: any) => PutItemCommand;
export declare const GetItems: () => QueryCommand;
export declare const GetUser: (id: string) => QueryCommand;
