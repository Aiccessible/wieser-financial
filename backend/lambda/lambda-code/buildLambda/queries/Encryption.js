"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptItemsInBatches = decryptItemsInBatches;
const client_kms_1 = require("@aws-sdk/client-kms");
const kmsClient = new client_kms_1.KMSClient({ region: 'ca-central-1' });
const KEY_ARN = process.env.KEY_ARN;
async function encryptData(data) {
    const command = new client_kms_1.EncryptCommand({
        KeyId: KEY_ARN,
        Plaintext: Buffer.from(data),
    });
    const response = await kmsClient.send(command);
    return response.CiphertextBlob?.toString() || '';
}
async function decryptData(encryptedData) {
    const command = new client_kms_1.DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, 'base64'),
    });
    const response = await kmsClient.send(command);
    return response.Plaintext?.toString() || '';
}
async function decryptItemsInBatches(items) {
    if (true) {
        return items;
    }
    const decryptedItems = [];
    // Split items into batches of 100
    for (let i = 0; i < items.length; i += 100) {
        const batch = items.slice(i, i + 100);
        // Decrypt each item in the batch concurrently
        const decryptedBatch = await Promise.all(batch.map(async (item) => {
            const decryptedItem = {};
            for (const [key, value] of Object.entries(item)) {
                if (key === 'pk' || key === 'sk') {
                    decryptedItem[key] = value;
                    continue;
                }
                if (value && value.S) {
                    // Decrypt string attributes
                    decryptedItem[key] = await decryptData(value.S);
                }
                else if (value && value.N) {
                    // Keep numbers as they are
                    decryptedItem[key] = value.N;
                }
                else if (value && value.B) {
                    // Decrypt binary attributes
                    const decryptedValue = await decryptData(value.B.toString('base64'));
                    decryptedItem[key] = Buffer.from(decryptedValue, 'base64');
                }
                else if (value && value.BOOL !== undefined) {
                    decryptedItem[key] = value.BOOL;
                }
                else if (value && value.NULL !== undefined) {
                    decryptedItem[key] = null;
                }
                else if (value && value.L) {
                    // Handle lists by recursively decrypting each element
                    decryptedItem[key] = await Promise.all(value.L.map(async (item) => await decryptData(item)));
                }
                else if (value && value.M) {
                    // Handle maps by recursively decrypting each attribute in the map
                    const decryptedMap = {};
                    for (const [mapKey, mapValue] of Object.entries(value.M)) {
                        decryptedMap[mapKey] = await decryptData(mapValue);
                    }
                    decryptedItem[key] = decryptedMap;
                }
                else {
                    // If attribute type is unrecognized, return as-is
                    decryptedItem[key] = value;
                }
            }
            return decryptedItem;
        }));
        // Add the decrypted batch to the final list of decrypted items
        decryptedItems.push(...decryptedBatch);
    }
    return decryptedItems;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW5jcnlwdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyaWVzL0VuY3J5cHRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQkEsc0RBNkRDO0FBdEZELG9EQUErRTtBQUUvRSxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtBQUUzRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQTtBQUVuQyxLQUFLLFVBQVUsV0FBVyxDQUFDLElBQVk7SUFDbkMsTUFBTSxPQUFPLEdBQUcsSUFBSSwyQkFBYyxDQUFDO1FBQy9CLEtBQUssRUFBRSxPQUFPO1FBQ2QsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQy9CLENBQUMsQ0FBQTtJQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM5QyxPQUFPLFFBQVEsQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFBO0FBQ3BELENBQUM7QUFFRCxLQUFLLFVBQVUsV0FBVyxDQUFDLGFBQXFCO0lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksMkJBQWMsQ0FBQztRQUMvQixjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDO0tBQ3ZELENBQUMsQ0FBQTtJQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM5QyxPQUFPLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFBO0FBQy9DLENBQUM7QUFFTSxLQUFLLFVBQVUscUJBQXFCLENBQUMsS0FBNEI7SUFDcEUsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNQLE9BQU8sS0FBSyxDQUFBO0lBQ2hC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YSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQTtnQkFDckMsQ0FBQztxQkFBTSxDQUFDO29CQUNKLGtEQUFrRDtvQkFDbEQsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtnQkFDOUIsQ0FBQztZQUNMLENBQUM7WUFFRCxPQUFPLGFBQWEsQ0FBQTtRQUN4QixDQUFDLENBQUMsQ0FDTCxDQUFBO1FBRUQsK0RBQStEO1FBQy9ELGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBRUQsT0FBTyxjQUFjLENBQUE7QUFDekIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1ZXJ5Q29tbWFuZE91dHB1dCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYidcbmltcG9ydCB7IEtNU0NsaWVudCwgRW5jcnlwdENvbW1hbmQsIERlY3J5cHRDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWttcydcblxuY29uc3Qga21zQ2xpZW50ID0gbmV3IEtNU0NsaWVudCh7IHJlZ2lvbjogJ2NhLWNlbnRyYWwtMScgfSlcblxuY29uc3QgS0VZX0FSTiA9IHByb2Nlc3MuZW52LktFWV9BUk5cblxuYXN5bmMgZnVuY3Rpb24gZW5jcnlwdERhdGEoZGF0YTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjb21tYW5kID0gbmV3IEVuY3J5cHRDb21tYW5kKHtcbiAgICAgICAgS2V5SWQ6IEtFWV9BUk4sXG4gICAgICAgIFBsYWludGV4dDogQnVmZmVyLmZyb20oZGF0YSksXG4gICAgfSlcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQga21zQ2xpZW50LnNlbmQoY29tbWFuZClcbiAgICByZXR1cm4gcmVzcG9uc2UuQ2lwaGVydGV4dEJsb2I/LnRvU3RyaW5nKCkgfHwgJydcbn1cblxuYXN5bmMgZnVuY3Rpb24gZGVjcnlwdERhdGEoZW5jcnlwdGVkRGF0YTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjb21tYW5kID0gbmV3IERlY3J5cHRDb21tYW5kKHtcbiAgICAgICAgQ2lwaGVydGV4dEJsb2I6IEJ1ZmZlci5mcm9tKGVuY3J5cHRlZERhdGEsICdiYXNlNjQnKSxcbiAgICB9KVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBrbXNDbGllbnQuc2VuZChjb21tYW5kKVxuICAgIHJldHVybiByZXNwb25zZS5QbGFpbnRleHQ/LnRvU3RyaW5nKCkgfHwgJydcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY3J5cHRJdGVtc0luQmF0Y2hlcyhpdGVtczogUmVjb3JkPHN0cmluZywgYW55PltdKSB7XG4gICAgaWYgKHRydWUpIHtcbiAgICAgICAgcmV0dXJuIGl0ZW1zXG4gICAgfVxuICAgIGNvbnN0IGRlY3J5cHRlZEl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+W10gPSBbXVxuXG4gICAgLy8gU3BsaXQgaXRlbXMgaW50byBiYXRjaGVzIG9mIDEwMFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEwMCkge1xuICAgICAgICBjb25zdCBiYXRjaCA9IGl0ZW1zLnNsaWNlKGksIGkgKyAxMDApXG5cbiAgICAgICAgLy8gRGVjcnlwdCBlYWNoIGl0ZW0gaW4gdGhlIGJhdGNoIGNvbmN1cnJlbnRseVxuICAgICAgICBjb25zdCBkZWNyeXB0ZWRCYXRjaCA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgYmF0Y2gubWFwKGFzeW5jIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVjcnlwdGVkSXRlbTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAncGsnIHx8IGtleSA9PT0gJ3NrJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVjcnlwdGVkSXRlbVtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlY3J5cHQgc3RyaW5nIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEl0ZW1ba2V5XSA9IGF3YWl0IGRlY3J5cHREYXRhKHZhbHVlLlMpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdmFsdWUuTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCBudW1iZXJzIGFzIHRoZXkgYXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRJdGVtW2tleV0gPSB2YWx1ZS5OXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdmFsdWUuQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVjcnlwdCBiaW5hcnkgYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVjcnlwdGVkVmFsdWUgPSBhd2FpdCBkZWNyeXB0RGF0YSh2YWx1ZS5CLnRvU3RyaW5nKCdiYXNlNjQnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEl0ZW1ba2V5XSA9IEJ1ZmZlci5mcm9tKGRlY3J5cHRlZFZhbHVlLCAnYmFzZTY0JylcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiB2YWx1ZS5CT09MICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEl0ZW1ba2V5XSA9IHZhbHVlLkJPT0xcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiB2YWx1ZS5OVUxMICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEl0ZW1ba2V5XSA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiB2YWx1ZS5MKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgbGlzdHMgYnkgcmVjdXJzaXZlbHkgZGVjcnlwdGluZyBlYWNoIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEl0ZW1ba2V5XSA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLkwubWFwKGFzeW5jIChpdGVtOiBhbnkpID0+IGF3YWl0IGRlY3J5cHREYXRhKGl0ZW0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlICYmIHZhbHVlLk0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBtYXBzIGJ5IHJlY3Vyc2l2ZWx5IGRlY3J5cHRpbmcgZWFjaCBhdHRyaWJ1dGUgaW4gdGhlIG1hcFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVjcnlwdGVkTWFwOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge31cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW21hcEtleSwgbWFwVmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhbHVlLk0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjcnlwdGVkTWFwW21hcEtleV0gPSBhd2FpdCBkZWNyeXB0RGF0YShtYXBWYWx1ZSBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRJdGVtW2tleV0gPSBkZWNyeXB0ZWRNYXBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGF0dHJpYnV0ZSB0eXBlIGlzIHVucmVjb2duaXplZCwgcmV0dXJuIGFzLWlzXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRJdGVtW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlY3J5cHRlZEl0ZW1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIClcblxuICAgICAgICAvLyBBZGQgdGhlIGRlY3J5cHRlZCBiYXRjaCB0byB0aGUgZmluYWwgbGlzdCBvZiBkZWNyeXB0ZWQgaXRlbXNcbiAgICAgICAgZGVjcnlwdGVkSXRlbXMucHVzaCguLi5kZWNyeXB0ZWRCYXRjaClcbiAgICB9XG5cbiAgICByZXR1cm4gZGVjcnlwdGVkSXRlbXNcbn1cbiJdfQ==