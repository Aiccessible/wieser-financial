import { AppSyncResolverHandler } from 'aws-lambda';
import { Recommendation } from './API';
export declare const getFinancialRecommendations: AppSyncResolverHandler<any, Recommendation[]>;
