import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { DataRangeResponse, InformationOptions } from '../gpt';
export interface EntityQueryParams {
    username: string;
    id: string;
    dateRange: DataRangeResponse | undefined;
    entityName: InformationOptions;
}
export declare const GetEntities: (params: EntityQueryParams) => QueryCommand;
