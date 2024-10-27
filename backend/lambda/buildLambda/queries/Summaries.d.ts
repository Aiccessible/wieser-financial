import { AggregatedSpending, DailySpendingSummary } from '../calculateIncomeAndSpending';
export declare function uploadSpendingSummaries(userId: string, dailySummaries: DailySpendingSummary[], monthlySummaries: {
    [monthYear: string]: AggregatedSpending;
}): Promise<void>;
