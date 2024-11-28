import { HighLevelTransactionCategory } from './API';
export type DailySpendingSummary = {
    date: string;
    spending: {
        [category in HighLevelTransactionCategory]?: number;
    };
};
export type AggregatedSpending = {
    daily_spending: DailySpendingSummary[];
    weekly_spending: {
        [category in HighLevelTransactionCategory]?: number;
    };
    monthly_spending: {
        [category in HighLevelTransactionCategory]?: number;
    };
};
export declare const calculateIncomeAndSpending: () => Promise<void>;
