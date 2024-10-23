import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { DataRangeResponse } from '../gpt';
export interface EntityQueryParams {
    username: string;
    id: string;
    dateRange: DataRangeResponse | undefined;
    entityName: string;
}
export declare const GetEntities: (params: EntityQueryParams) => QueryCommand;
