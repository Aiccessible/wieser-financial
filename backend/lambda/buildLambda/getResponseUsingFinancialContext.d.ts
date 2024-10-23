import { AppSyncResolverHandler } from 'aws-lambda';
import { ChatResponse } from './API';
export type EntityName = 'SECURITY' | 'TRANSACTION' | 'ACCOUNT';
export declare const getResponseUsingFinancialContext: AppSyncResolverHandler<any, ChatResponse>;
