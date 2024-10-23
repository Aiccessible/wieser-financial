"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAccountToChatInput = exports.mapDynamoDBToAccount = void 0;
// Mapper function for DynamoDB to Account interface
function mapDynamoDBToAccount(item) {
    return {
        __typename: 'Account', // Fixed value for __typename
        account_id: item.account_id.S || '', // DynamoDB string type
        type: item.type?.S || null, // Nullable string
        name: item.name?.S || null, // Nullable string
        subtype: item.subtype?.S || null, // Nullable string
        balances: item.balances
            ? {
                __typename: 'Balances', // Fixed value for __typename inside balances
                current: item.balances.M?.current?.N || null, // Handle numeric value
                // available: item.balances.M?.available?.NULL ? null : item.balances.M?.available?.N || null, // Handle NULL or numeric value
                // limit: item.balances.M?.limit?.NULL ? null : item.balances.M?.limit?.N || null, // Handle NULL or numeric value
                iso_currency_code: item.balances.M?.iso_currency_code?.S || null, // Nullable string
            }
            : null,
        mask: item.mask?.S || null, // Nullable string
    };
}
exports.mapDynamoDBToAccount = mapDynamoDBToAccount;
const mapAccountToChatInput = (account) => {
    let chatInput = '';
    // Append general account information
    chatInput += `Type: ${account.type || 'N/A'}\n`;
    chatInput += `Name: ${account.name || 'N/A'}\n`;
    // Check if balances are available and append balance information
    if (account.balances) {
        chatInput += `Current Balance: ${account.balances.current ? `$${parseFloat(account.balances.current).toFixed(2)}` : 'N/A'}\n`;
        chatInput += `Currency: ${account.balances.iso_currency_code || 'N/A'}\n`;
    }
    // Append mask information if available
    chatInput += `)\n`;
    return chatInput;
};
exports.mapAccountToChatInput = mapAccountToChatInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNjb3VudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFwcGVycy9BY2NvdW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxvREFBb0Q7QUFDcEQsU0FBZ0Isb0JBQW9CLENBQUMsSUFBdUM7SUFDeEUsT0FBTztRQUNILFVBQVUsRUFBRSxTQUFTLEVBQUUsNkJBQTZCO1FBQ3BELFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsdUJBQXVCO1FBQzVELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsa0JBQWtCO1FBQzlDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsa0JBQWtCO1FBQzlDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsa0JBQWtCO1FBQ3BELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUNuQixDQUFDLENBQUM7Z0JBQ0ksVUFBVSxFQUFFLFVBQVUsRUFBRSw2Q0FBNkM7Z0JBQ3JFLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSx1QkFBdUI7Z0JBQ3JFLDhIQUE4SDtnQkFDOUgsa0hBQWtIO2dCQUNsSCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLGtCQUFrQjthQUN2RjtZQUNILENBQUMsQ0FBQyxJQUFJO1FBQ1YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxrQkFBa0I7S0FDakQsQ0FBQTtBQUNMLENBQUM7QUFsQkQsb0RBa0JDO0FBRU0sTUFBTSxxQkFBcUIsR0FBRyxDQUFDLE9BQWdCLEVBQVUsRUFBRTtJQUM5RCxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUE7SUFFbEIscUNBQXFDO0lBQ3JDLFNBQVMsSUFBSSxTQUFTLE9BQU8sQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUE7SUFDL0MsU0FBUyxJQUFJLFNBQVMsT0FBTyxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQTtJQUUvQyxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkIsU0FBUyxJQUFJLG9CQUNULE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUN2RixJQUFJLENBQUE7UUFDSixTQUFTLElBQUksYUFBYSxPQUFPLENBQUMsUUFBUSxDQUFDLGlCQUFpQixJQUFJLEtBQUssSUFBSSxDQUFBO0lBQzdFLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMsU0FBUyxJQUFJLEtBQUssQ0FBQTtJQUVsQixPQUFPLFNBQVMsQ0FBQTtBQUNwQixDQUFDLENBQUE7QUFuQlksUUFBQSxxQkFBcUIseUJBbUJqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF0dHJpYnV0ZVZhbHVlIH0gZnJvbSAnYXdzLXNkay9jbGllbnRzL2R5bmFtb2RiJ1xuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gJy4uL0FQSSdcblxuLy8gTWFwcGVyIGZ1bmN0aW9uIGZvciBEeW5hbW9EQiB0byBBY2NvdW50IGludGVyZmFjZVxuZXhwb3J0IGZ1bmN0aW9uIG1hcER5bmFtb0RCVG9BY2NvdW50KGl0ZW06IHsgW2tleTogc3RyaW5nXTogQXR0cmlidXRlVmFsdWUgfSk6IEFjY291bnQge1xuICAgIHJldHVybiB7XG4gICAgICAgIF9fdHlwZW5hbWU6ICdBY2NvdW50JywgLy8gRml4ZWQgdmFsdWUgZm9yIF9fdHlwZW5hbWVcbiAgICAgICAgYWNjb3VudF9pZDogaXRlbS5hY2NvdW50X2lkLlMgfHwgJycsIC8vIER5bmFtb0RCIHN0cmluZyB0eXBlXG4gICAgICAgIHR5cGU6IGl0ZW0udHlwZT8uUyB8fCBudWxsLCAvLyBOdWxsYWJsZSBzdHJpbmdcbiAgICAgICAgbmFtZTogaXRlbS5uYW1lPy5TIHx8IG51bGwsIC8vIE51bGxhYmxlIHN0cmluZ1xuICAgICAgICBzdWJ0eXBlOiBpdGVtLnN1YnR5cGU/LlMgfHwgbnVsbCwgLy8gTnVsbGFibGUgc3RyaW5nXG4gICAgICAgIGJhbGFuY2VzOiBpdGVtLmJhbGFuY2VzXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgIF9fdHlwZW5hbWU6ICdCYWxhbmNlcycsIC8vIEZpeGVkIHZhbHVlIGZvciBfX3R5cGVuYW1lIGluc2lkZSBiYWxhbmNlc1xuICAgICAgICAgICAgICAgICAgY3VycmVudDogaXRlbS5iYWxhbmNlcy5NPy5jdXJyZW50Py5OIHx8IG51bGwsIC8vIEhhbmRsZSBudW1lcmljIHZhbHVlXG4gICAgICAgICAgICAgICAgICAvLyBhdmFpbGFibGU6IGl0ZW0uYmFsYW5jZXMuTT8uYXZhaWxhYmxlPy5OVUxMID8gbnVsbCA6IGl0ZW0uYmFsYW5jZXMuTT8uYXZhaWxhYmxlPy5OIHx8IG51bGwsIC8vIEhhbmRsZSBOVUxMIG9yIG51bWVyaWMgdmFsdWVcbiAgICAgICAgICAgICAgICAgIC8vIGxpbWl0OiBpdGVtLmJhbGFuY2VzLk0/LmxpbWl0Py5OVUxMID8gbnVsbCA6IGl0ZW0uYmFsYW5jZXMuTT8ubGltaXQ/Lk4gfHwgbnVsbCwgLy8gSGFuZGxlIE5VTEwgb3IgbnVtZXJpYyB2YWx1ZVxuICAgICAgICAgICAgICAgICAgaXNvX2N1cnJlbmN5X2NvZGU6IGl0ZW0uYmFsYW5jZXMuTT8uaXNvX2N1cnJlbmN5X2NvZGU/LlMgfHwgbnVsbCwgLy8gTnVsbGFibGUgc3RyaW5nXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgbWFzazogaXRlbS5tYXNrPy5TIHx8IG51bGwsIC8vIE51bGxhYmxlIHN0cmluZ1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IG1hcEFjY291bnRUb0NoYXRJbnB1dCA9IChhY2NvdW50OiBBY2NvdW50KTogc3RyaW5nID0+IHtcbiAgICBsZXQgY2hhdElucHV0ID0gJydcblxuICAgIC8vIEFwcGVuZCBnZW5lcmFsIGFjY291bnQgaW5mb3JtYXRpb25cbiAgICBjaGF0SW5wdXQgKz0gYFR5cGU6ICR7YWNjb3VudC50eXBlIHx8ICdOL0EnfVxcbmBcbiAgICBjaGF0SW5wdXQgKz0gYE5hbWU6ICR7YWNjb3VudC5uYW1lIHx8ICdOL0EnfVxcbmBcblxuICAgIC8vIENoZWNrIGlmIGJhbGFuY2VzIGFyZSBhdmFpbGFibGUgYW5kIGFwcGVuZCBiYWxhbmNlIGluZm9ybWF0aW9uXG4gICAgaWYgKGFjY291bnQuYmFsYW5jZXMpIHtcbiAgICAgICAgY2hhdElucHV0ICs9IGBDdXJyZW50IEJhbGFuY2U6ICR7XG4gICAgICAgICAgICBhY2NvdW50LmJhbGFuY2VzLmN1cnJlbnQgPyBgJCR7cGFyc2VGbG9hdChhY2NvdW50LmJhbGFuY2VzLmN1cnJlbnQpLnRvRml4ZWQoMil9YCA6ICdOL0EnXG4gICAgICAgIH1cXG5gXG4gICAgICAgIGNoYXRJbnB1dCArPSBgQ3VycmVuY3k6ICR7YWNjb3VudC5iYWxhbmNlcy5pc29fY3VycmVuY3lfY29kZSB8fCAnTi9BJ31cXG5gXG4gICAgfVxuXG4gICAgLy8gQXBwZW5kIG1hc2sgaW5mb3JtYXRpb24gaWYgYXZhaWxhYmxlXG4gICAgY2hhdElucHV0ICs9IGApXFxuYFxuXG4gICAgcmV0dXJuIGNoYXRJbnB1dFxufVxuIl19