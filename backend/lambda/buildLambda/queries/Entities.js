"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEntities = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
function mapStartDayToDate(startDay) {
    const { day, month, year } = startDay;
    // Ensure the day and month are two digits by padding them with zeroes
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0'); // Months should be zero-padded
    // Return the date in 'YYYY-MM-DD' format
    return `${year}-${formattedMonth}-${formattedDay}`;
}
// SECURITY and ACCOUNT dont have date range in key
const GetEntities = (params) => {
    const filter = {
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
            ':pk': { S: `USER#${params.username}#ITEM#${params.id}` },
            ':sk': { S: `${params.entityName}` },
        },
    };
    if (params.dateRange && !params.dateRange.hasNoTimeConstraint) {
        filter['FilterExpression'] = '#date BETWEEN :startDate AND :endDate';
        filter['ExpressionAttributeValues'][':startDate'] = { S: mapStartDayToDate(params.dateRange.startDay) };
        filter['ExpressionAttributeValues'][':endDate'] = { S: mapStartDayToDate(params.dateRange.endDay) };
    }
    console.info(params);
    return new client_dynamodb_1.QueryCommand({
        TableName: process.env.TABLE_NAME,
        ...filter,
    });
};
exports.GetEntities = GetEntities;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW50aXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcXVlcmllcy9FbnRpdGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBdUQ7QUFXdkQsU0FBUyxpQkFBaUIsQ0FBQyxRQUF5QjtJQUNoRCxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUE7SUFFckMsc0VBQXNFO0lBQ3RFLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2pELE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBLENBQUMsK0JBQStCO0lBRXJGLHlDQUF5QztJQUN6QyxPQUFPLEdBQUcsSUFBSSxJQUFJLGNBQWMsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUN0RCxDQUFDO0FBRUQsbURBQW1EO0FBQzVDLE1BQU0sV0FBVyxHQUFHLENBQUMsTUFBeUIsRUFBRSxFQUFFO0lBQ3JELE1BQU0sTUFBTSxHQUFRO1FBQ2hCLHNCQUFzQixFQUFFLG1DQUFtQztRQUMzRCx5QkFBeUIsRUFBRTtZQUN2QixLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsUUFBUSxNQUFNLENBQUMsUUFBUSxTQUFTLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUN6RCxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUU7U0FDdkM7S0FDSixDQUFBO0lBQ0QsSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzVELE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLHVDQUF1QyxDQUFBO1FBQ3BFLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQTtRQUN2RyxNQUFNLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUE7SUFDdkcsQ0FBQztJQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDcEIsT0FBTyxJQUFJLDhCQUFZLENBQUM7UUFDcEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVTtRQUNqQyxHQUFHLE1BQU07S0FDWixDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFsQlksUUFBQSxXQUFXLGVBa0J2QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1ZXJ5Q29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYidcbmltcG9ydCB7IERhdGFSYW5nZVJlc3BvbnNlLCBHcHREYXRlUmVzcG9uc2UsIEluZm9ybWF0aW9uT3B0aW9ucyB9IGZyb20gJy4uL2dwdCdcbmltcG9ydCB7IEVudGl0eU5hbWUgfSBmcm9tICcuLi9nZXRSZXNwb25zZVVzaW5nRmluYW5jaWFsQ29udGV4dCdcblxuZXhwb3J0IGludGVyZmFjZSBFbnRpdHlRdWVyeVBhcmFtcyB7XG4gICAgdXNlcm5hbWU6IHN0cmluZ1xuICAgIGlkOiBzdHJpbmdcbiAgICBkYXRlUmFuZ2U6IERhdGFSYW5nZVJlc3BvbnNlIHwgdW5kZWZpbmVkXG4gICAgZW50aXR5TmFtZTogc3RyaW5nXG59XG5cbmZ1bmN0aW9uIG1hcFN0YXJ0RGF5VG9EYXRlKHN0YXJ0RGF5OiBHcHREYXRlUmVzcG9uc2UpOiBzdHJpbmcge1xuICAgIGNvbnN0IHsgZGF5LCBtb250aCwgeWVhciB9ID0gc3RhcnREYXlcblxuICAgIC8vIEVuc3VyZSB0aGUgZGF5IGFuZCBtb250aCBhcmUgdHdvIGRpZ2l0cyBieSBwYWRkaW5nIHRoZW0gd2l0aCB6ZXJvZXNcbiAgICBjb25zdCBmb3JtYXR0ZWREYXkgPSBTdHJpbmcoZGF5KS5wYWRTdGFydCgyLCAnMCcpXG4gICAgY29uc3QgZm9ybWF0dGVkTW9udGggPSBTdHJpbmcobW9udGgpLnBhZFN0YXJ0KDIsICcwJykgLy8gTW9udGhzIHNob3VsZCBiZSB6ZXJvLXBhZGRlZFxuXG4gICAgLy8gUmV0dXJuIHRoZSBkYXRlIGluICdZWVlZLU1NLUREJyBmb3JtYXRcbiAgICByZXR1cm4gYCR7eWVhcn0tJHtmb3JtYXR0ZWRNb250aH0tJHtmb3JtYXR0ZWREYXl9YFxufVxuXG4vLyBTRUNVUklUWSBhbmQgQUNDT1VOVCBkb250IGhhdmUgZGF0ZSByYW5nZSBpbiBrZXlcbmV4cG9ydCBjb25zdCBHZXRFbnRpdGllcyA9IChwYXJhbXM6IEVudGl0eVF1ZXJ5UGFyYW1zKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyOiBhbnkgPSB7XG4gICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdwayA9IDpwayBBTkQgYmVnaW5zX3dpdGgoc2ssIDpzayknLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOnBrJzogeyBTOiBgVVNFUiMke3BhcmFtcy51c2VybmFtZX0jSVRFTSMke3BhcmFtcy5pZH1gIH0sXG4gICAgICAgICAgICAnOnNrJzogeyBTOiBgJHtwYXJhbXMuZW50aXR5TmFtZX1gIH0sXG4gICAgICAgIH0sXG4gICAgfVxuICAgIGlmIChwYXJhbXMuZGF0ZVJhbmdlICYmICFwYXJhbXMuZGF0ZVJhbmdlLmhhc05vVGltZUNvbnN0cmFpbnQpIHtcbiAgICAgICAgZmlsdGVyWydGaWx0ZXJFeHByZXNzaW9uJ10gPSAnI2RhdGUgQkVUV0VFTiA6c3RhcnREYXRlIEFORCA6ZW5kRGF0ZSdcbiAgICAgICAgZmlsdGVyWydFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzJ11bJzpzdGFydERhdGUnXSA9IHsgUzogbWFwU3RhcnREYXlUb0RhdGUocGFyYW1zLmRhdGVSYW5nZS5zdGFydERheSkgfVxuICAgICAgICBmaWx0ZXJbJ0V4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMnXVsnOmVuZERhdGUnXSA9IHsgUzogbWFwU3RhcnREYXlUb0RhdGUocGFyYW1zLmRhdGVSYW5nZS5lbmREYXkpIH1cbiAgICB9XG4gICAgY29uc29sZS5pbmZvKHBhcmFtcylcbiAgICByZXR1cm4gbmV3IFF1ZXJ5Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSxcbiAgICAgICAgLi4uZmlsdGVyLFxuICAgIH0pXG59XG4iXX0=