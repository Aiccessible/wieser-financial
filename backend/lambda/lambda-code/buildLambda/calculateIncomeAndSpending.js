"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIncomeAndSpending = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const Entities_1 = require("./queries/Entities");
const Encryption_1 = require("./queries/Encryption");
const Item_1 = require("./mappers/Item");
const API_1 = require("./API");
const Transactions_1 = require("./mappers/Transactions");
const Summaries_1 = require("./queries/Summaries");
const client = new client_dynamodb_1.DynamoDBClient({ region: 'ca-central-1' });
function aggregateSpendingByCategory(transactions) {
    const MS_IN_A_DAY = 1000 * 60 * 60 * 24;
    // Initialize accumulators
    const dailySpendingMap = {};
    const weeklySpending = {};
    const monthlySpending = {};
    // Step 1: Sum amounts per category by day
    for (const transaction of transactions) {
        if (transaction.amount && transaction.date) {
            const amount = parseFloat(transaction.amount);
            const date = new Date(transaction.date);
            const dateKey = date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
            // Only consider transactions that are spending, not income or transfers
            let category;
            if ((transaction.personal_finance_category?.detailed).S in API_1.HighLevelTransactionCategory) {
                category = (transaction.personal_finance_category?.detailed).S ?? '';
            }
            else {
                category = (transaction.personal_finance_category?.primary).S ?? '';
            }
            if (category) {
                // Initialize daily spending map for the date if not present
                if (!dailySpendingMap[dateKey]) {
                    dailySpendingMap[dateKey] = {};
                }
                if (category === 'RENT_AND_UTILITIES_RENT') {
                    console.info(transaction);
                }
                // Aggregate amounts for each category in daily, weekly, and monthly maps
                dailySpendingMap[dateKey][category] = (dailySpendingMap[dateKey][category] || 0) + Math.abs(amount);
                weeklySpending[category] = (weeklySpending[category] || 0) + Math.abs(amount);
                monthlySpending[category] = (monthlySpending[category] || 0) + Math.abs(amount);
            }
        }
    }
    // Convert daily spending map to an array of DailySpendingSummary
    const dailySpendingSummaries = Object.entries(dailySpendingMap).map(([date, spending]) => ({
        date,
        spending,
    }));
    // Step 2: Calculate date range for averages
    const transactionDates = Object.keys(dailySpendingMap).map((date) => new Date(date));
    if (transactionDates.length === 0) {
        throw new Error('No valid transactions found to aggregate.');
    }
    const minDate = new Date(Math.min(...transactionDates.map((date) => date.getTime())));
    const maxDate = new Date(Math.max(...transactionDates.map((date) => date.getTime())));
    const durationInDays = (maxDate.getTime() - minDate.getTime()) / MS_IN_A_DAY;
    // Step 3: Calculate weekly and monthly averages
    for (const category of Object.keys(weeklySpending)) {
        if (weeklySpending[category])
            weeklySpending[category] /= durationInDays / 7;
        if (monthlySpending[category])
            monthlySpending[category] /= durationInDays / 30;
    }
    return {
        daily_spending: dailySpendingSummaries,
        weekly_spending: weeklySpending,
        monthly_spending: monthlySpending,
    };
}
function groupTransactionsByMonth(transactions) {
    const monthlyAggregates = {};
    const transactionsByMonth = transactions.reduce((acc, transaction) => {
        if (transaction.date) {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(transaction);
        }
        return acc;
    }, {});
    for (const [monthYear, monthTransactions] of Object.entries(transactionsByMonth)) {
        monthlyAggregates[monthYear] = aggregateSpendingByCategory(monthTransactions);
    }
    return monthlyAggregates;
}
function getEarliestFirstOfMonthWithin90Days() {
    return new Date(new Date().getTime() - 1000 * 3600 * 24 * 365);
}
const calculateIncomeAndSpending = async () => {
    // TODO: Add logic to handle last calculated complete month and start from then
    const items = (await (0, Encryption_1.decryptItemsInBatches)((await client.send((0, Entities_1.GetItems)()))?.Items ?? [])).map(Item_1.mapDdbResponseToItem);
    /** TODO: Just add created at to the item? */
    const encryptedUserItemRecord = await Promise.all(items.map(async (el) => await client.send((0, Entities_1.GetUser)(el.sk || ''))));
    const decryptedUserItemRecord = (await (0, Encryption_1.decryptItemsInBatches)(encryptedUserItemRecord.flatMap((output) => output.Items ?? [])))
        .map(Item_1.mapDdbResponseToItem)
        .filter((item) => {
        console.info('Processing', item);
        return item.pk && item.created_at;
    });
    const ids = decryptedUserItemRecord.map((user) => user.pk?.replace(/#ITEM#\w+/, '') + '#TRANSACTIONS');
    const distinctUsers = [...new Set(ids)];
    /** Go through users and aggregate transactions */
    await processUsersInBatches(distinctUsers);
};
exports.calculateIncomeAndSpending = calculateIncomeAndSpending;
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
async function processUsersInBatches(decryptedUserItemRecord) {
    const userBatches = chunkArray(decryptedUserItemRecord, 100);
    const now = new Date(); // Get the current date and time
    for (const batch of userBatches) {
        await Promise.all(batch.map(async (item) => {
            const startDay = getEarliestFirstOfMonthWithin90Days();
            const encryptedTransactions = await client.send((0, Entities_1.GetEntities)({
                pk: item ?? '',
                dateRange: {
                    startDay: {
                        day: startDay.getDate() + 1,
                        month: startDay.getMonth() + 1,
                        year: startDay.getFullYear(),
                    },
                    endDay: {
                        day: now.getDate() + 1,
                        month: now.getMonth() + 1,
                        year: now.getFullYear(),
                    },
                    hasNoTimeConstraint: false,
                },
                username: '',
                id: '',
                entityName: 'TRANSACTION',
                getAllTransactionsForUser: true,
            }));
            const decryptedTransactions = (await (0, Encryption_1.decryptItemsInBatches)(encryptedTransactions.Items ?? [])).map(Transactions_1.mapDynamoDBToTransaction);
            console.info(decryptedTransactions);
            const aggregates = groupTransactionsByMonth(decryptedTransactions);
            await (0, Summaries_1.uploadSpendingSummaries)(item ?? '', Object.entries(aggregates).flatMap((el) => el[1].daily_spending), aggregates);
        }));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsY3VsYXRlSW5jb21lQW5kU3BlbmRpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY2FsY3VsYXRlSW5jb21lQW5kU3BlbmRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsOERBQXlFO0FBQ3pFLGlEQUFtRTtBQUNuRSxxREFBNEQ7QUFDNUQseUNBQXFEO0FBQ3JELCtCQUF1RTtBQUN2RSx5REFBaUU7QUFDakUsbURBQTZEO0FBRzdELE1BQU0sTUFBTSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFBO0FBaUI3RCxTQUFTLDJCQUEyQixDQUFDLFlBQTJCO0lBQzVELE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQTtJQUV2QywwQkFBMEI7SUFDMUIsTUFBTSxnQkFBZ0IsR0FBZ0YsRUFBRSxDQUFBO0lBQ3hHLE1BQU0sY0FBYyxHQUFHLEVBQTZELENBQUE7SUFDcEYsTUFBTSxlQUFlLEdBQUcsRUFBNkQsQ0FBQTtJQUVyRiwwQ0FBMEM7SUFDMUMsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNyQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDN0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQyw0QkFBNEI7WUFFN0Usd0VBQXdFO1lBQ3hFLElBQUksUUFBc0MsQ0FBQTtZQUMxQyxJQUFJLENBQUMsV0FBVyxDQUFDLHlCQUF5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LENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQ2hFLFVBQVUsQ0FDYixDQUFBO1FBQ0wsQ0FBQyxDQUFDLENBQ0wsQ0FBQTtJQUNMLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHluYW1vREJDbGllbnQsIFB1dEl0ZW1Db21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJ1xuaW1wb3J0IHsgR2V0RW50aXRpZXMsIEdldEl0ZW1zLCBHZXRVc2VyIH0gZnJvbSAnLi9xdWVyaWVzL0VudGl0aWVzJ1xuaW1wb3J0IHsgZGVjcnlwdEl0ZW1zSW5CYXRjaGVzIH0gZnJvbSAnLi9xdWVyaWVzL0VuY3J5cHRpb24nXG5pbXBvcnQgeyBtYXBEZGJSZXNwb25zZVRvSXRlbSB9IGZyb20gJy4vbWFwcGVycy9JdGVtJ1xuaW1wb3J0IHsgSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeSwgSXRlbSwgVHJhbnNhY3Rpb24gfSBmcm9tICcuL0FQSSdcbmltcG9ydCB7IG1hcER5bmFtb0RCVG9UcmFuc2FjdGlvbiB9IGZyb20gJy4vbWFwcGVycy9UcmFuc2FjdGlvbnMnXG5pbXBvcnQgeyB1cGxvYWRTcGVuZGluZ1N1bW1hcmllcyB9IGZyb20gJy4vcXVlcmllcy9TdW1tYXJpZXMnXG5pbXBvcnQgeyBhbnkgfSBmcm9tICd6b2QnXG5cbmNvbnN0IGNsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7IHJlZ2lvbjogJ2NhLWNlbnRyYWwtMScgfSlcblxuZXhwb3J0IHR5cGUgRGFpbHlTcGVuZGluZ1N1bW1hcnkgPSB7XG4gICAgZGF0ZTogc3RyaW5nXG4gICAgc3BlbmRpbmc6IHsgW2NhdGVnb3J5IGluIEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnldPzogbnVtYmVyIH1cbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRlZFNwZW5kaW5nID0ge1xuICAgIGRhaWx5X3NwZW5kaW5nOiBEYWlseVNwZW5kaW5nU3VtbWFyeVtdXG4gICAgd2Vla2x5X3NwZW5kaW5nOiB7IFtjYXRlZ29yeSBpbiBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5XT86IG51bWJlciB9XG4gICAgbW9udGhseV9zcGVuZGluZzogeyBbY2F0ZWdvcnkgaW4gSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeV0/OiBudW1iZXIgfVxufVxuXG50eXBlIE1vbnRobHlTcGVuZGluZ0FnZ3JlZ2F0ZXMgPSB7XG4gICAgW21vbnRoWWVhcjogc3RyaW5nXTogQWdncmVnYXRlZFNwZW5kaW5nXG59XG5cbmZ1bmN0aW9uIGFnZ3JlZ2F0ZVNwZW5kaW5nQnlDYXRlZ29yeSh0cmFuc2FjdGlvbnM6IFRyYW5zYWN0aW9uW10pOiBBZ2dyZWdhdGVkU3BlbmRpbmcge1xuICAgIGNvbnN0IE1TX0lOX0FfREFZID0gMTAwMCAqIDYwICogNjAgKiAyNFxuXG4gICAgLy8gSW5pdGlhbGl6ZSBhY2N1bXVsYXRvcnNcbiAgICBjb25zdCBkYWlseVNwZW5kaW5nTWFwOiB7IFtkYXRlOiBzdHJpbmddOiB7IFtjYXRlZ29yeSBpbiBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5XT86IG51bWJlciB9IH0gPSB7fVxuICAgIGNvbnN0IHdlZWtseVNwZW5kaW5nID0ge30gYXMgeyBbY2F0ZWdvcnkgaW4gSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeV0/OiBudW1iZXIgfVxuICAgIGNvbnN0IG1vbnRobHlTcGVuZGluZyA9IHt9IGFzIHsgW2NhdGVnb3J5IGluIEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnldPzogbnVtYmVyIH1cblxuICAgIC8vIFN0ZXAgMTogU3VtIGFtb3VudHMgcGVyIGNhdGVnb3J5IGJ5IGRheVxuICAgIGZvciAoY29uc3QgdHJhbnNhY3Rpb24gb2YgdHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGlmICh0cmFuc2FjdGlvbi5hbW91bnQgJiYgdHJhbnNhY3Rpb24uZGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgYW1vdW50ID0gcGFyc2VGbG9hdCh0cmFuc2FjdGlvbi5hbW91bnQpXG4gICAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodHJhbnNhY3Rpb24uZGF0ZSlcbiAgICAgICAgICAgIGNvbnN0IGRhdGVLZXkgPSBkYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSAvLyBGb3JtYXQgZGF0ZSBhcyBZWVlZLU1NLUREXG5cbiAgICAgICAgICAgIC8vIE9ubHkgY29uc2lkZXIgdHJhbnNhY3Rpb25zIHRoYXQgYXJlIHNwZW5kaW5nLCBub3QgaW5jb21lIG9yIHRyYW5zZmVyc1xuICAgICAgICAgICAgbGV0IGNhdGVnb3J5OiBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5XG4gICAgICAgICAgICBpZiAoKHRyYW5zYWN0aW9uLnBlcnNvbmFsX2ZpbmFuY2VfY2F0ZWdvcnk/LmRldGFpbGVkIGFzIGFueSkuUyBpbiBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnkgPSAodHJhbnNhY3Rpb24ucGVyc29uYWxfZmluYW5jZV9jYXRlZ29yeT8uZGV0YWlsZWQgYXMgYW55KS5TID8/ICcnXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5ID0gKHRyYW5zYWN0aW9uLnBlcnNvbmFsX2ZpbmFuY2VfY2F0ZWdvcnk/LnByaW1hcnkgYXMgYW55KS5TID8/ICcnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIGRhaWx5IHNwZW5kaW5nIG1hcCBmb3IgdGhlIGRhdGUgaWYgbm90IHByZXNlbnRcbiAgICAgICAgICAgICAgICBpZiAoIWRhaWx5U3BlbmRpbmdNYXBbZGF0ZUtleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZGFpbHlTcGVuZGluZ01hcFtkYXRlS2V5XSA9IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjYXRlZ29yeSA9PT0gJ1JFTlRfQU5EX1VUSUxJVElFU19SRU5UJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8odHJhbnNhY3Rpb24pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFnZ3JlZ2F0ZSBhbW91bnRzIGZvciBlYWNoIGNhdGVnb3J5IGluIGRhaWx5LCB3ZWVrbHksIGFuZCBtb250aGx5IG1hcHNcbiAgICAgICAgICAgICAgICBkYWlseVNwZW5kaW5nTWFwW2RhdGVLZXldW2NhdGVnb3J5XSA9IChkYWlseVNwZW5kaW5nTWFwW2RhdGVLZXldW2NhdGVnb3J5XSB8fCAwKSArIE1hdGguYWJzKGFtb3VudClcbiAgICAgICAgICAgICAgICB3ZWVrbHlTcGVuZGluZ1tjYXRlZ29yeV0gPSAod2Vla2x5U3BlbmRpbmdbY2F0ZWdvcnldIHx8IDApICsgTWF0aC5hYnMoYW1vdW50KVxuICAgICAgICAgICAgICAgIG1vbnRobHlTcGVuZGluZ1tjYXRlZ29yeV0gPSAobW9udGhseVNwZW5kaW5nW2NhdGVnb3J5XSB8fCAwKSArIE1hdGguYWJzKGFtb3VudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbnZlcnQgZGFpbHkgc3BlbmRpbmcgbWFwIHRvIGFuIGFycmF5IG9mIERhaWx5U3BlbmRpbmdTdW1tYXJ5XG4gICAgY29uc3QgZGFpbHlTcGVuZGluZ1N1bW1hcmllczogRGFpbHlTcGVuZGluZ1N1bW1hcnlbXSA9IE9iamVjdC5lbnRyaWVzKGRhaWx5U3BlbmRpbmdNYXApLm1hcCgoW2RhdGUsIHNwZW5kaW5nXSkgPT4gKHtcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgc3BlbmRpbmcsXG4gICAgfSkpXG5cbiAgICAvLyBTdGVwIDI6IENhbGN1bGF0ZSBkYXRlIHJhbmdlIGZvciBhdmVyYWdlc1xuICAgIGNvbnN0IHRyYW5zYWN0aW9uRGF0ZXMgPSBPYmplY3Qua2V5cyhkYWlseVNwZW5kaW5nTWFwKS5tYXAoKGRhdGUpID0+IG5ldyBEYXRlKGRhdGUpKVxuICAgIGlmICh0cmFuc2FjdGlvbkRhdGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHZhbGlkIHRyYW5zYWN0aW9ucyBmb3VuZCB0byBhZ2dyZWdhdGUuJylcbiAgICB9XG5cbiAgICBjb25zdCBtaW5EYXRlID0gbmV3IERhdGUoTWF0aC5taW4oLi4udHJhbnNhY3Rpb25EYXRlcy5tYXAoKGRhdGUpID0+IGRhdGUuZ2V0VGltZSgpKSkpXG4gICAgY29uc3QgbWF4RGF0ZSA9IG5ldyBEYXRlKE1hdGgubWF4KC4uLnRyYW5zYWN0aW9uRGF0ZXMubWFwKChkYXRlKSA9PiBkYXRlLmdldFRpbWUoKSkpKVxuICAgIGNvbnN0IGR1cmF0aW9uSW5EYXlzID0gKG1heERhdGUuZ2V0VGltZSgpIC0gbWluRGF0ZS5nZXRUaW1lKCkpIC8gTVNfSU5fQV9EQVlcblxuICAgIC8vIFN0ZXAgMzogQ2FsY3VsYXRlIHdlZWtseSBhbmQgbW9udGhseSBhdmVyYWdlc1xuICAgIGZvciAoY29uc3QgY2F0ZWdvcnkgb2YgT2JqZWN0LmtleXMod2Vla2x5U3BlbmRpbmcpIGFzIEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnlbXSkge1xuICAgICAgICBpZiAod2Vla2x5U3BlbmRpbmdbY2F0ZWdvcnldKSB3ZWVrbHlTcGVuZGluZ1tjYXRlZ29yeV0hIC89IGR1cmF0aW9uSW5EYXlzIC8gN1xuICAgICAgICBpZiAobW9udGhseVNwZW5kaW5nW2NhdGVnb3J5XSkgbW9udGhseVNwZW5kaW5nW2NhdGVnb3J5XSEgLz0gZHVyYXRpb25JbkRheXMgLyAzMFxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGRhaWx5X3NwZW5kaW5nOiBkYWlseVNwZW5kaW5nU3VtbWFyaWVzLFxuICAgICAgICB3ZWVrbHlfc3BlbmRpbmc6IHdlZWtseVNwZW5kaW5nLFxuICAgICAgICBtb250aGx5X3NwZW5kaW5nOiBtb250aGx5U3BlbmRpbmcsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBncm91cFRyYW5zYWN0aW9uc0J5TW9udGgodHJhbnNhY3Rpb25zOiBUcmFuc2FjdGlvbltdKTogTW9udGhseVNwZW5kaW5nQWdncmVnYXRlcyB7XG4gICAgY29uc3QgbW9udGhseUFnZ3JlZ2F0ZXM6IE1vbnRobHlTcGVuZGluZ0FnZ3JlZ2F0ZXMgPSB7fVxuXG4gICAgY29uc3QgdHJhbnNhY3Rpb25zQnlNb250aDogeyBbbW9udGhZZWFyOiBzdHJpbmddOiBUcmFuc2FjdGlvbltdIH0gPSB0cmFuc2FjdGlvbnMucmVkdWNlKChhY2MsIHRyYW5zYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0cmFuc2FjdGlvbi5kYXRlKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodHJhbnNhY3Rpb24uZGF0ZSlcbiAgICAgICAgICAgIGNvbnN0IG1vbnRoWWVhciA9IGAke2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtkYXRlLmdldE1vbnRoKCkgKyAxfWBcblxuICAgICAgICAgICAgaWYgKCFhY2NbbW9udGhZZWFyXSkge1xuICAgICAgICAgICAgICAgIGFjY1ttb250aFllYXJdID0gW11cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWNjW21vbnRoWWVhcl0ucHVzaCh0cmFuc2FjdGlvbilcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjXG4gICAgfSwge30gYXMgeyBbbW9udGhZZWFyOiBzdHJpbmddOiBUcmFuc2FjdGlvbltdIH0pXG5cbiAgICBmb3IgKGNvbnN0IFttb250aFllYXIsIG1vbnRoVHJhbnNhY3Rpb25zXSBvZiBPYmplY3QuZW50cmllcyh0cmFuc2FjdGlvbnNCeU1vbnRoKSkge1xuICAgICAgICBtb250aGx5QWdncmVnYXRlc1ttb250aFllYXJdID0gYWdncmVnYXRlU3BlbmRpbmdCeUNhdGVnb3J5KG1vbnRoVHJhbnNhY3Rpb25zKVxuICAgIH1cblxuICAgIHJldHVybiBtb250aGx5QWdncmVnYXRlc1xufVxuZnVuY3Rpb24gZ2V0RWFybGllc3RGaXJzdE9mTW9udGhXaXRoaW45MERheXMoKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gMTAwMCAqIDM2MDAgKiAyNCAqIDM2NSlcbn1cblxuZXhwb3J0IGNvbnN0IGNhbGN1bGF0ZUluY29tZUFuZFNwZW5kaW5nID0gYXN5bmMgKCkgPT4ge1xuICAgIC8vIFRPRE86IEFkZCBsb2dpYyB0byBoYW5kbGUgbGFzdCBjYWxjdWxhdGVkIGNvbXBsZXRlIG1vbnRoIGFuZCBzdGFydCBmcm9tIHRoZW5cbiAgICBjb25zdCBpdGVtcyA9IChhd2FpdCBkZWNyeXB0SXRlbXNJbkJhdGNoZXMoKGF3YWl0IGNsaWVudC5zZW5kKEdldEl0ZW1zKCkpKT8uSXRlbXMgPz8gW10pKS5tYXAobWFwRGRiUmVzcG9uc2VUb0l0ZW0pXG4gICAgLyoqIFRPRE86IEp1c3QgYWRkIGNyZWF0ZWQgYXQgdG8gdGhlIGl0ZW0/ICovXG4gICAgY29uc3QgZW5jcnlwdGVkVXNlckl0ZW1SZWNvcmQgPSBhd2FpdCBQcm9taXNlLmFsbChpdGVtcy5tYXAoYXN5bmMgKGVsKSA9PiBhd2FpdCBjbGllbnQuc2VuZChHZXRVc2VyKGVsLnNrIHx8ICcnKSkpKVxuICAgIGNvbnN0IGRlY3J5cHRlZFVzZXJJdGVtUmVjb3JkID0gKFxuICAgICAgICBhd2FpdCBkZWNyeXB0SXRlbXNJbkJhdGNoZXMoZW5jcnlwdGVkVXNlckl0ZW1SZWNvcmQuZmxhdE1hcCgob3V0cHV0KSA9PiBvdXRwdXQuSXRlbXMgPz8gW10pKVxuICAgIClcbiAgICAgICAgLm1hcChtYXBEZGJSZXNwb25zZVRvSXRlbSlcbiAgICAgICAgLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdQcm9jZXNzaW5nJywgaXRlbSlcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnBrICYmIGl0ZW0uY3JlYXRlZF9hdFxuICAgICAgICB9KVxuICAgIGNvbnN0IGlkcyA9IGRlY3J5cHRlZFVzZXJJdGVtUmVjb3JkLm1hcCgodXNlcikgPT4gdXNlci5waz8ucmVwbGFjZSgvI0lURU0jXFx3Ky8sICcnKSArICcjVFJBTlNBQ1RJT05TJylcbiAgICBjb25zdCBkaXN0aW5jdFVzZXJzID0gWy4uLm5ldyBTZXQoaWRzKV1cblxuICAgIC8qKiBHbyB0aHJvdWdoIHVzZXJzIGFuZCBhZ2dyZWdhdGUgdHJhbnNhY3Rpb25zICovXG4gICAgYXdhaXQgcHJvY2Vzc1VzZXJzSW5CYXRjaGVzKGRpc3RpbmN0VXNlcnMgYXMgc3RyaW5nW10pXG59XG5cbmZ1bmN0aW9uIGNodW5rQXJyYXk8VD4oYXJyYXk6IFRbXSwgY2h1bmtTaXplOiBudW1iZXIpOiBUW11bXSB7XG4gICAgY29uc3QgY2h1bmtzOiBUW11bXSA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkgKz0gY2h1bmtTaXplKSB7XG4gICAgICAgIGNodW5rcy5wdXNoKGFycmF5LnNsaWNlKGksIGkgKyBjaHVua1NpemUpKVxuICAgIH1cbiAgICByZXR1cm4gY2h1bmtzXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NVc2Vyc0luQmF0Y2hlcyhkZWNyeXB0ZWRVc2VySXRlbVJlY29yZDogc3RyaW5nW10pIHtcbiAgICBjb25zdCB1c2VyQmF0Y2hlcyA9IGNodW5rQXJyYXkoZGVjcnlwdGVkVXNlckl0ZW1SZWNvcmQsIDEwMClcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpIC8vIEdldCB0aGUgY3VycmVudCBkYXRlIGFuZCB0aW1lXG5cbiAgICBmb3IgKGNvbnN0IGJhdGNoIG9mIHVzZXJCYXRjaGVzKSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgYmF0Y2gubWFwKGFzeW5jIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnREYXkgPSBnZXRFYXJsaWVzdEZpcnN0T2ZNb250aFdpdGhpbjkwRGF5cygpXG4gICAgICAgICAgICAgICAgY29uc3QgZW5jcnlwdGVkVHJhbnNhY3Rpb25zID0gYXdhaXQgY2xpZW50LnNlbmQoXG4gICAgICAgICAgICAgICAgICAgIEdldEVudGl0aWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBrOiBpdGVtID8/ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVJhbmdlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnREYXk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5OiBzdGFydERheS5nZXREYXRlKCkgKyAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aDogc3RhcnREYXkuZ2V0TW9udGgoKSArIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHllYXI6IHN0YXJ0RGF5LmdldEZ1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmREYXk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5OiBub3cuZ2V0RGF0ZSgpICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGg6IG5vdy5nZXRNb250aCgpICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeWVhcjogbm93LmdldEZ1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNOb1RpbWVDb25zdHJhaW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRpdHlOYW1lOiAnVFJBTlNBQ1RJT04nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QWxsVHJhbnNhY3Rpb25zRm9yVXNlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICBjb25zdCBkZWNyeXB0ZWRUcmFuc2FjdGlvbnMgPSAoYXdhaXQgZGVjcnlwdEl0ZW1zSW5CYXRjaGVzKGVuY3J5cHRlZFRyYW5zYWN0aW9ucy5JdGVtcyA/PyBbXSkpLm1hcChcbiAgICAgICAgICAgICAgICAgICAgbWFwRHluYW1vREJUb1RyYW5zYWN0aW9uXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGRlY3J5cHRlZFRyYW5zYWN0aW9ucylcbiAgICAgICAgICAgICAgICBjb25zdCBhZ2dyZWdhdGVzID0gZ3JvdXBUcmFuc2FjdGlvbnNCeU1vbnRoKGRlY3J5cHRlZFRyYW5zYWN0aW9ucylcblxuICAgICAgICAgICAgICAgIGF3YWl0IHVwbG9hZFNwZW5kaW5nU3VtbWFyaWVzKFxuICAgICAgICAgICAgICAgICAgICBpdGVtID8/ICcnLFxuICAgICAgICAgICAgICAgICAgICBPYmplY3QuZW50cmllcyhhZ2dyZWdhdGVzKS5mbGF0TWFwKChlbCkgPT4gZWxbMV0uZGFpbHlfc3BlbmRpbmcpLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVzXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgIH1cbn1cbiJdfQ==