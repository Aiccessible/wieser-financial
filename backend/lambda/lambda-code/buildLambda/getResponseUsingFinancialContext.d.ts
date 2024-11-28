import { AppSyncResolverHandler } from 'aws-lambda';
import { ChatResponse, CacheIdentifer } from './API';
export type EntityName = 'SECURITY' | 'TRANSACTION' | 'ACCOUNT' | 'MONTHLYSUMMARY';
export declare const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse>;
export declare const getCacheKey: (user: string, id: CacheIdentifer) => string | null | undefined;
