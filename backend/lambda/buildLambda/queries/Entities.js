"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUser = exports.GetItems = exports.PutCacheEntity = exports.GetCacheEntity = exports.GetEntities = exports.detailedCategories = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
function mapStartDayToDate(startDay) {
    const { day, month, year } = startDay;
    // Ensure the day and month are two digits by padding them with zeroes
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0'); // Months should be zero-padded
    // Return the date in 'YYYY-MM-DD' format
    return `${year}-${formattedMonth}-${formattedDay}`;
}
exports.detailedCategories = ['TRANSFER_IN', 'TRANSFER_OUT', 'LOAN_PAYMENTS', 'RENT_AND_UTILITIES'];
// SECURITY and ACCOUNT dont have date range in key
const GetEntities = (params) => {
    let filter = {
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
            ':pk': { S: params.pk ?? `USER#${params.username}#ITEM#${params.id}` },
            ':sk': { S: `${params.entityName}` },
        },
    };
    if (params.getAllTransactionsForUser) {
        filter = {
            KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk)',
            ExpressionAttributeValues: {
                ':gsi1pk': { S: params.pk ?? `USER#${params.username}#TRANSACTIONS` },
                ':gsi1sk': { S: `${params.entityName}` },
            },
            IndexName: 'GSI1',
        };
    }
    if (params.getAllSecuritiesForUser) {
        filter = {
            KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk)',
            ExpressionAttributeValues: {
                ':gsi1pk': { S: params.pk ?? `USER#${params.username}#SECURITY` },
                ':gsi1sk': { S: `${params.entityName}` },
            },
            IndexName: 'GSI1',
        };
    }
    if (params.entityName === 'MONTHLYSUMMARY') {
        filter = {
            KeyConditionExpression: 'pk = :gsi1pk ',
            ExpressionAttributeValues: {
                ':gsi1pk': { S: params.pk ?? `USER#${params.username}#TRANSACTIONS#MONTHLYSUMMARY` },
            },
        };
    }
    if (params.dateRange && !params.dateRange.hasNoTimeConstraint) {
        filter = { ...filter, ExpressionAttributeNames: {} };
        filter['FilterExpression'] = '#date BETWEEN :startDate AND :endDate';
        filter['ExpressionAttributeValues'][':startDate'] = { S: mapStartDayToDate(params.dateRange.startDay) };
        filter['ExpressionAttributeValues'][':endDate'] = { S: mapStartDayToDate(params.dateRange.endDay) };
        filter['ExpressionAttributeNames'] = { '#date': 'date' };
    }
    if (params.customDateRange) {
        filter = { ...filter, ExpressionAttributeNames: {} };
        filter['FilterExpression'] = '#date BETWEEN :startDate AND :endDate';
        filter['ExpressionAttributeValues'][':startDate'] = {
            S: params.customDateRange[0] ? new Date(params.customDateRange[0]).toISOString().split('.')[0] : 0,
        };
        filter['ExpressionAttributeValues'][':endDate'] = {
            S: params.customDateRange[1]
                ? new Date(params.customDateRange[1]).toISOString().split('.')[0]
                : new Date().toISOString().split('.')[0],
        };
        filter['ExpressionAttributeNames'] = { '#date': 'date' };
    }
    console.info('FINAL filter', filter);
    if (params.highLevelCategory) {
        const isDetailedCategory = exports.detailedCategories
            .map((category) => params.highLevelCategory?.includes(category))
            .includes(true);
        if (!filter['FilterExpression']) {
            filter['FilterExpression'] = '#keyOne.#finance = :primaryCategory';
        }
        else {
            filter['FilterExpression'] = filter['FilterExpression'] + ' AND #keyOne.#finance = :primaryCategory';
        }
        filter['ExpressionAttributeValues'][':primaryCategory'] = {
            S: params.highLevelCategory,
        };
        filter['ExpressionAttributeNames'] = {
            ...(filter['ExpressionAttributeNames'] ?? {}),
            '#finance': isDetailedCategory ? 'detailed' : 'primary',
            '#keyOne': 'personal_finance_category',
        };
    }
    return new client_dynamodb_1.QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    });
};
exports.GetEntities = GetEntities;
const GetCacheEntity = (params) => {
    const filter = {
        KeyConditionExpression: 'pk = :pk AND sk = :sk',
        ExpressionAttributeValues: {
            ':pk': { S: `CACHEENTITY#${params.id}` },
            ':sk': { S: params.sk },
        },
    };
    if (params.expire_at) {
        // Adding the FilterExpression to check if expire_at is less than the provided expire_at
        filter['FilterExpression'] = '#expiresAt > :expiresAt';
        filter['ExpressionAttributeNames'] = {
            '#expiresAt': 'expire_at', // Using attribute name mapping for ExpiresAt
        };
        filter['ExpressionAttributeValues'][':expiresAt'] = { N: params.expire_at.toString() }; // Assuming expiresAt is a number
    }
    console.info(params);
    return new client_dynamodb_1.QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    });
};
exports.GetCacheEntity = GetCacheEntity;
const PutCacheEntity = (params, data) => {
    const item = {
        pk: { S: `CACHEENTITY#${params.id}` },
        sk: { S: params.sk },
        expire_at: { N: params.expire_at.toString() }, // Storing ExpiresAt as a number (timestamp)
        ...data, // Spread any additional data attributes
    };
    return new client_dynamodb_1.PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
    });
};
exports.PutCacheEntity = PutCacheEntity;
const GetItems = () => {
    const filter = {
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
            ':pk': { S: `ITEMS` },
        },
    };
    return new client_dynamodb_1.QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    });
};
exports.GetItems = GetItems;
const GetUser = (id) => {
    const filter = {
        KeyConditionExpression: 'pk = :pk and sk = :sk',
        ExpressionAttributeValues: {
            ':pk': { S: id },
            ':sk': { S: 'v0' },
        },
    };
    return new client_dynamodb_1.QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    });
};
exports.GetUser = GetUser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW50aXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcXVlcmllcy9FbnRpdGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBdUU7QUFzQnZFLFNBQVMsaUJBQWlCLENBQUMsUUFBeUI7SUFDaEQsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFBO0lBRXJDLHNFQUFzRTtJQUN0RSxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqRCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQSxDQUFDLCtCQUErQjtJQUVyRix5Q0FBeUM7SUFDekMsT0FBTyxHQUFHLElBQUksSUFBSSxjQUFjLElBQUksWUFBWSxFQUFFLENBQUE7QUFDdEQsQ0FBQztBQUVZLFFBQUEsa0JBQWtCLEdBQUcsQ0FBQyxhQUFhLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO0FBQ3hHLG1EQUFtRDtBQUM1QyxNQUFNLFdBQVcsR0FBRyxDQUFDLE1BQXlCLEVBQUUsRUFBRTtJQUNyRCxJQUFJLE1BQU0sR0FBUTtRQUNkLHNCQUFzQixFQUFFLG1DQUFtQztRQUMzRCx5QkFBeUIsRUFBRTtZQUN2QixLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxRQUFRLE1BQU0sQ0FBQyxRQUFRLFNBQVMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3RFLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsRUFBRTtTQUN2QztLQUNKLENBQUE7SUFDRCxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1FBQ25DLE1B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QUFZLENBQUM7UUFDcEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVTtRQUNqQyxHQUFHLE1BQU07S0FDWixDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFaWSxRQUFBLE9BQU8sV0FZbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBRdWVyeUNvbW1hbmQsIFB1dEl0ZW1Db21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJ1xuaW1wb3J0IHsgRGF0YVJhbmdlUmVzcG9uc2UsIEdwdERhdGVSZXNwb25zZSB9IGZyb20gJy4uL2dwdCdcbmltcG9ydCB7IEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnkgfSBmcm9tICcuLi9BUEknXG5cbmV4cG9ydCBpbnRlcmZhY2UgRW50aXR5UXVlcnlQYXJhbXMge1xuICAgIHVzZXJuYW1lOiBzdHJpbmdcbiAgICBpZDogc3RyaW5nXG4gICAgZGF0ZVJhbmdlOiBEYXRhUmFuZ2VSZXNwb25zZSB8IHVuZGVmaW5lZFxuICAgIGN1c3RvbURhdGVSYW5nZT86IFtudW1iZXI/LCBudW1iZXI/XSB8IG51bGwgfCB1bmRlZmluZWRcbiAgICBlbnRpdHlOYW1lOiBzdHJpbmdcbiAgICBwaz86IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgIGhpZ2hMZXZlbENhdGVnb3J5PzogSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeVxuICAgIGdldEFsbFRyYW5zYWN0aW9uc0ZvclVzZXI/OiBib29sZWFuXG4gICAgZ2V0QWxsU2VjdXJpdGllc0ZvclVzZXI/OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2FjaGVFbnRpdHlRdWVyeVBhcmFtIHtcbiAgICBpZDogc3RyaW5nXG4gICAgZXhwaXJlX2F0OiBudW1iZXJcbiAgICBzazogc3RyaW5nXG59XG5cbmZ1bmN0aW9uIG1hcFN0YXJ0RGF5VG9EYXRlKHN0YXJ0RGF5OiBHcHREYXRlUmVzcG9uc2UpOiBzdHJpbmcge1xuICAgIGNvbnN0IHsgZGF5LCBtb250aCwgeWVhciB9ID0gc3RhcnREYXlcblxuICAgIC8vIEVuc3VyZSB0aGUgZGF5IGFuZCBtb250aCBhcmUgdHdvIGRpZ2l0cyBieSBwYWRkaW5nIHRoZW0gd2l0aCB6ZXJvZXNcbiAgICBjb25zdCBmb3JtYXR0ZWREYXkgPSBTdHJpbmcoZGF5KS5wYWRTdGFydCgyLCAnMCcpXG4gICAgY29uc3QgZm9ybWF0dGVkTW9udGggPSBTdHJpbmcobW9udGgpLnBhZFN0YXJ0KDIsICcwJykgLy8gTW9udGhzIHNob3VsZCBiZSB6ZXJvLXBhZGRlZFxuXG4gICAgLy8gUmV0dXJuIHRoZSBkYXRlIGluICdZWVlZLU1NLUREJyBmb3JtYXRcbiAgICByZXR1cm4gYCR7eWVhcn0tJHtmb3JtYXR0ZWRNb250aH0tJHtmb3JtYXR0ZWREYXl9YFxufVxuXG5leHBvcnQgY29uc3QgZGV0YWlsZWRDYXRlZ29yaWVzID0gWydUUkFOU0ZFUl9JTicsICdUUkFOU0ZFUl9PVVQnLCAnTE9BTl9QQVlNRU5UUycsICdSRU5UX0FORF9VVElMSVRJRVMnXVxuLy8gU0VDVVJJVFkgYW5kIEFDQ09VTlQgZG9udCBoYXZlIGRhdGUgcmFuZ2UgaW4ga2V5XG5leHBvcnQgY29uc3QgR2V0RW50aXRpZXMgPSAocGFyYW1zOiBFbnRpdHlRdWVyeVBhcmFtcykgPT4ge1xuICAgIGxldCBmaWx0ZXI6IGFueSA9IHtcbiAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ3BrID0gOnBrIEFORCBiZWdpbnNfd2l0aChzaywgOnNrKScsXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAgICc6cGsnOiB7IFM6IHBhcmFtcy5wayA/PyBgVVNFUiMke3BhcmFtcy51c2VybmFtZX0jSVRFTSMke3BhcmFtcy5pZH1gIH0sXG4gICAgICAgICAgICAnOnNrJzogeyBTOiBgJHtwYXJhbXMuZW50aXR5TmFtZX1gIH0sXG4gICAgICAgIH0sXG4gICAgfVxuICAgIGlmIChwYXJhbXMuZ2V0QWxsVHJhbnNhY3Rpb25zRm9yVXNlcikge1xuICAgICAgICBmaWx0ZXIgPSB7XG4gICAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnZ3NpMXBrID0gOmdzaTFwayBBTkQgYmVnaW5zX3dpdGgoZ3NpMXNrLCA6Z3NpMXNrKScsXG4gICAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAgICAgJzpnc2kxcGsnOiB7IFM6IHBhcmFtcy5wayA/PyBgVVNFUiMke3BhcmFtcy51c2VybmFtZX0jVFJBTlNBQ1RJT05TYCB9LFxuICAgICAgICAgICAgICAgICc6Z3NpMXNrJzogeyBTOiBgJHtwYXJhbXMuZW50aXR5TmFtZX1gIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgSW5kZXhOYW1lOiAnR1NJMScsXG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBhcmFtcy5nZXRBbGxTZWN1cml0aWVzRm9yVXNlcikge1xuICAgICAgICBmaWx0ZXIgPSB7XG4gICAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnZ3NpMXBrID0gOmdzaTFwayBBTkQgYmVnaW5zX3dpdGgoZ3NpMXNrLCA6Z3NpMXNrKScsXG4gICAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAgICAgJzpnc2kxcGsnOiB7IFM6IHBhcmFtcy5wayA/PyBgVVNFUiMke3BhcmFtcy51c2VybmFtZX0jU0VDVVJJVFlgIH0sXG4gICAgICAgICAgICAgICAgJzpnc2kxc2snOiB7IFM6IGAke3BhcmFtcy5lbnRpdHlOYW1lfWAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBJbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocGFyYW1zLmVudGl0eU5hbWUgPT09ICdNT05USExZU1VNTUFSWScpIHtcbiAgICAgICAgZmlsdGVyID0ge1xuICAgICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ3BrID0gOmdzaTFwayAnLFxuICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgICAgICc6Z3NpMXBrJzogeyBTOiBwYXJhbXMucGsgPz8gYFVTRVIjJHtwYXJhbXMudXNlcm5hbWV9I1RSQU5TQUNUSU9OUyNNT05USExZU1VNTUFSWWAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBhcmFtcy5kYXRlUmFuZ2UgJiYgIXBhcmFtcy5kYXRlUmFuZ2UuaGFzTm9UaW1lQ29uc3RyYWludCkge1xuICAgICAgICBmaWx0ZXIgPSB7IC4uLmZpbHRlciwgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7fSB9XG4gICAgICAgIGZpbHRlclsnRmlsdGVyRXhwcmVzc2lvbiddID0gJyNkYXRlIEJFVFdFRU4gOnN0YXJ0RGF0ZSBBTkQgOmVuZERhdGUnXG4gICAgICAgIGZpbHRlclsnRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyddWyc6c3RhcnREYXRlJ10gPSB7IFM6IG1hcFN0YXJ0RGF5VG9EYXRlKHBhcmFtcy5kYXRlUmFuZ2Uuc3RhcnREYXkpIH1cbiAgICAgICAgZmlsdGVyWydFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzJ11bJzplbmREYXRlJ10gPSB7IFM6IG1hcFN0YXJ0RGF5VG9EYXRlKHBhcmFtcy5kYXRlUmFuZ2UuZW5kRGF5KSB9XG4gICAgICAgIGZpbHRlclsnRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzJ10gPSB7ICcjZGF0ZSc6ICdkYXRlJyB9XG4gICAgfVxuICAgIGlmIChwYXJhbXMuY3VzdG9tRGF0ZVJhbmdlKSB7XG4gICAgICAgIGZpbHRlciA9IHsgLi4uZmlsdGVyLCBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHt9IH1cbiAgICAgICAgZmlsdGVyWydGaWx0ZXJFeHByZXNzaW9uJ10gPSAnI2RhdGUgQkVUV0VFTiA6c3RhcnREYXRlIEFORCA6ZW5kRGF0ZSdcbiAgICAgICAgZmlsdGVyWydFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzJ11bJzpzdGFydERhdGUnXSA9IHtcbiAgICAgICAgICAgIFM6IHBhcmFtcy5jdXN0b21EYXRlUmFuZ2VbMF0gPyBuZXcgRGF0ZShwYXJhbXMuY3VzdG9tRGF0ZVJhbmdlWzBdKS50b0lTT1N0cmluZygpLnNwbGl0KCcuJylbMF0gOiAwLFxuICAgICAgICB9XG4gICAgICAgIGZpbHRlclsnRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyddWyc6ZW5kRGF0ZSddID0ge1xuICAgICAgICAgICAgUzogcGFyYW1zLmN1c3RvbURhdGVSYW5nZVsxXVxuICAgICAgICAgICAgICAgID8gbmV3IERhdGUocGFyYW1zLmN1c3RvbURhdGVSYW5nZVsxXSkudG9JU09TdHJpbmcoKS5zcGxpdCgnLicpWzBdXG4gICAgICAgICAgICAgICAgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJy4nKVswXSxcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJbJ0V4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyddID0geyAnI2RhdGUnOiAnZGF0ZScgfVxuICAgIH1cbiAgICBjb25zb2xlLmluZm8oJ0ZJTkFMIGZpbHRlcicsIGZpbHRlcilcbiAgICBpZiAocGFyYW1zLmhpZ2hMZXZlbENhdGVnb3J5KSB7XG4gICAgICAgIGNvbnN0IGlzRGV0YWlsZWRDYXRlZ29yeSA9IGRldGFpbGVkQ2F0ZWdvcmllc1xuICAgICAgICAgICAgLm1hcCgoY2F0ZWdvcnkpID0+IHBhcmFtcy5oaWdoTGV2ZWxDYXRlZ29yeT8uaW5jbHVkZXMoY2F0ZWdvcnkpKVxuICAgICAgICAgICAgLmluY2x1ZGVzKHRydWUpXG4gICAgICAgIGlmICghZmlsdGVyWydGaWx0ZXJFeHByZXNzaW9uJ10pIHtcbiAgICAgICAgICAgIGZpbHRlclsnRmlsdGVyRXhwcmVzc2lvbiddID0gJyNrZXlPbmUuI2ZpbmFuY2UgPSA6cHJpbWFyeUNhdGVnb3J5J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVyWydGaWx0ZXJFeHByZXNzaW9uJ10gPSBmaWx0ZXJbJ0ZpbHRlckV4cHJlc3Npb24nXSArICcgQU5EICNrZXlPbmUuI2ZpbmFuY2UgPSA6cHJpbWFyeUNhdGVnb3J5J1xuICAgICAgICB9XG4gICAgICAgIGZpbHRlclsnRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyddWyc6cHJpbWFyeUNhdGVnb3J5J10gPSB7XG4gICAgICAgICAgICBTOiBwYXJhbXMuaGlnaExldmVsQ2F0ZWdvcnksXG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyWydFeHByZXNzaW9uQXR0cmlidXRlTmFtZXMnXSA9IHtcbiAgICAgICAgICAgIC4uLihmaWx0ZXJbJ0V4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyddID8/IHt9KSxcbiAgICAgICAgICAgICcjZmluYW5jZSc6IGlzRGV0YWlsZWRDYXRlZ29yeSA/ICdkZXRhaWxlZCcgOiAncHJpbWFyeScsXG4gICAgICAgICAgICAnI2tleU9uZSc6ICdwZXJzb25hbF9maW5hbmNlX2NhdGVnb3J5JyxcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFF1ZXJ5Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSxcbiAgICAgICAgLi4uZmlsdGVyLFxuICAgIH0pXG59XG5cbmV4cG9ydCBjb25zdCBHZXRDYWNoZUVudGl0eSA9IChwYXJhbXM6IENhY2hlRW50aXR5UXVlcnlQYXJhbSkgPT4ge1xuICAgIGNvbnN0IGZpbHRlcjogYW55ID0ge1xuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAncGsgPSA6cGsgQU5EIHNrID0gOnNrJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzpwayc6IHsgUzogYENBQ0hFRU5USVRZIyR7cGFyYW1zLmlkfWAgfSxcbiAgICAgICAgICAgICc6c2snOiB7IFM6IHBhcmFtcy5zayB9LFxuICAgICAgICB9LFxuICAgIH1cbiAgICBpZiAocGFyYW1zLmV4cGlyZV9hdCkge1xuICAgICAgICAvLyBBZGRpbmcgdGhlIEZpbHRlckV4cHJlc3Npb24gdG8gY2hlY2sgaWYgZXhwaXJlX2F0IGlzIGxlc3MgdGhhbiB0aGUgcHJvdmlkZWQgZXhwaXJlX2F0XG4gICAgICAgIGZpbHRlclsnRmlsdGVyRXhwcmVzc2lvbiddID0gJyNleHBpcmVzQXQgPiA6ZXhwaXJlc0F0J1xuICAgICAgICBmaWx0ZXJbJ0V4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyddID0ge1xuICAgICAgICAgICAgJyNleHBpcmVzQXQnOiAnZXhwaXJlX2F0JywgLy8gVXNpbmcgYXR0cmlidXRlIG5hbWUgbWFwcGluZyBmb3IgRXhwaXJlc0F0XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyWydFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzJ11bJzpleHBpcmVzQXQnXSA9IHsgTjogcGFyYW1zLmV4cGlyZV9hdC50b1N0cmluZygpIH0gLy8gQXNzdW1pbmcgZXhwaXJlc0F0IGlzIGEgbnVtYmVyXG4gICAgfVxuXG4gICAgY29uc29sZS5pbmZvKHBhcmFtcylcbiAgICByZXR1cm4gbmV3IFF1ZXJ5Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSxcbiAgICAgICAgLi4uZmlsdGVyLFxuICAgIH0pXG59XG5cbmV4cG9ydCBjb25zdCBQdXRDYWNoZUVudGl0eSA9IChwYXJhbXM6IENhY2hlRW50aXR5UXVlcnlQYXJhbSwgZGF0YTogYW55KSA9PiB7XG4gICAgY29uc3QgaXRlbSA9IHtcbiAgICAgICAgcGs6IHsgUzogYENBQ0hFRU5USVRZIyR7cGFyYW1zLmlkfWAgfSxcbiAgICAgICAgc2s6IHsgUzogcGFyYW1zLnNrIH0sXG4gICAgICAgIGV4cGlyZV9hdDogeyBOOiBwYXJhbXMuZXhwaXJlX2F0LnRvU3RyaW5nKCkgfSwgLy8gU3RvcmluZyBFeHBpcmVzQXQgYXMgYSBudW1iZXIgKHRpbWVzdGFtcClcbiAgICAgICAgLi4uZGF0YSwgLy8gU3ByZWFkIGFueSBhZGRpdGlvbmFsIGRhdGEgYXR0cmlidXRlc1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHV0SXRlbUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LlRBQkxFX05BTUUsXG4gICAgICAgIEl0ZW06IGl0ZW0sXG4gICAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IEdldEl0ZW1zID0gKCkgPT4ge1xuICAgIGNvbnN0IGZpbHRlcjogYW55ID0ge1xuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAncGsgPSA6cGsnLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOnBrJzogeyBTOiBgSVRFTVNgIH0sXG4gICAgICAgIH0sXG4gICAgfVxuICAgIHJldHVybiBuZXcgUXVlcnlDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5UQUJMRV9OQU1FLFxuICAgICAgICAuLi5maWx0ZXIsXG4gICAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IEdldFVzZXIgPSAoaWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGZpbHRlcjogYW55ID0ge1xuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAncGsgPSA6cGsgYW5kIHNrID0gOnNrJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzpwayc6IHsgUzogaWQgfSxcbiAgICAgICAgICAgICc6c2snOiB7IFM6ICd2MCcgfSxcbiAgICAgICAgfSxcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LlRBQkxFX05BTUUsXG4gICAgICAgIC4uLmZpbHRlcixcbiAgICB9KVxufVxuIl19