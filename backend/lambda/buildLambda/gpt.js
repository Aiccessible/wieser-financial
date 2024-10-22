"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessagesForThread = exports.runThread = exports.codeInterperterForAnalysis = exports.uploadFileToAssistant = exports.createAssistant = exports.getTechnicalWordsWhereWeCanGoDeeper = exports.completeChatFromPrompt = exports.getFinancialRecommendationsFromData = exports.apiClient = void 0;
const openai_1 = require("openai");
const zod_1 = require("zod");
const zod_2 = require("openai/helpers/zod");
const API_1 = require("./API");
const recommendationAction = zod_1.z.object({
    description: zod_1.z.string(),
    transfers: zod_1.z.array(zod_1.z.object({
        amount: zod_1.z.string(),
        fromAccountName: zod_1.z.string(),
        toAccountName: zod_1.z.string(),
    })),
});
const Recommendations = zod_1.z.object({
    recommendations: zod_1.z.array(zod_1.z.object({
        explanation: zod_1.z.string(),
        action: recommendationAction,
        title: zod_1.z.string(),
        priority: zod_1.z.enum(['High', 'Medium', 'Low']),
    })),
});
exports.apiClient = new openai_1.default({
    apiKey: process.env['GptSecretKey'],
    dangerouslyAllowBrowser: false,
});
const chat = exports.apiClient.chat;
const getFinancialRecommendationsFromData = async (prompt) => {
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'system',
                content: 'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. Leave the transfer information empty if no transfer is needed',
            },
            {
                role: 'user',
                content: prompt.substring(0, 20000),
            },
        ],
        model: 'gpt-4o',
        response_format: (0, zod_2.zodResponseFormat)(Recommendations, 'recommendations'),
    });
    return chatOutput.choices[0].message;
};
exports.getFinancialRecommendationsFromData = getFinancialRecommendationsFromData;
const completeChatFromPrompt = async (prompt, type) => {
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a personal ${type && type !== API_1.ChatFocus.All ? type : 'Finance'} assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions.`,
            },
            {
                role: 'user',
                content: prompt.substring(0, 20000),
            },
        ],
        model: 'gpt-4o',
    });
    return chatOutput.choices[0].message;
};
exports.completeChatFromPrompt = completeChatFromPrompt;
const flatten = (value) => {
    // If the value is an array, flatten each element recursively
    if (Array.isArray(value)) {
        return value.flatMap(flatten); // Use flatMap to flatten the array recursively
    }
    // If the value is an object, flatten its values recursively
    if (typeof value === 'object' && value !== null) {
        return flatten(Object.values(value));
    }
    // If the value is neither an array nor an object, return it as a single-element array
    return [value];
};
const getTechnicalWordsWhereWeCanGoDeeper = async (prompt) => {
    try {
        const chatOutput = await chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'We are summarizing financial information return the exact phrases (include special characters and punctuation) where we could do financial analysis into the topic.  respond in the json format [phrase1, phrase2]]',
                },
                {
                    role: 'user',
                    content: prompt.substring(0, 20000),
                },
            ],
            response_format: { type: 'json_object' },
            model: 'gpt-3.5-turbo',
        });
        const jsonObject = JSON.parse(chatOutput.choices[0].message.content || '');
        if (jsonObject.phrase1 || jsonObject.phrases || Object.keys(jsonObject).length > 0) {
            return flatten(Object.values(jsonObject));
        }
        else if (jsonObject.length) {
            return flatten(jsonObject);
        }
        else {
            return [];
        }
    }
    catch (e) {
        return [];
    }
};
exports.getTechnicalWordsWhereWeCanGoDeeper = getTechnicalWordsWhereWeCanGoDeeper;
const createAssistant = async () => exports.apiClient.beta.assistants.create({
    instructions: 'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. write and run code to answer the question.',
    model: 'gpt-4o-mini',
    tools: [{ type: 'code_interpreter' }],
});
exports.createAssistant = createAssistant;
const uploadFileToAssistant = async (file) => {
    // Upload a file with an "assistants" purpose
    const fileReturn = await exports.apiClient.files.create({
        file: file,
        purpose: 'assistants',
    });
    return fileReturn;
};
exports.uploadFileToAssistant = uploadFileToAssistant;
const codeInterperterForAnalysis = async (fileIds, assistant_id, prompt) => {
    const thread = await exports.apiClient.beta.threads.create({
        messages: [
            {
                role: 'user',
                content: prompt,
                attachments: fileIds.map((fileId) => ({ file_id: fileId, tools: [{ type: 'code_interpreter' }] })),
            },
        ],
    });
    return thread;
};
exports.codeInterperterForAnalysis = codeInterperterForAnalysis;
const runThread = async (threadId, assistant_id) => {
    const runParams = {
        assistant_id: assistant_id,
        tool_choice: { type: 'code_interpreter' },
    };
    const status = await exports.apiClient.beta.threads.runs.createAndPoll(threadId, runParams);
    // Upload a file with an "assistants" purpose
    console.log(status);
    return status;
};
exports.runThread = runThread;
const listMessagesForThread = async (threadId) => {
    const messages = await exports.apiClient.beta.threads.messages.list(threadId);
    // Upload a file with an "assistants" purpose
    console.log(messages);
    return messages;
};
exports.listMessagesForThread = listMessagesForThread;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUd0RCwrQkFBaUM7QUFFakMsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRixNQUFNLGVBQWUsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQzdCLGVBQWUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNwQixPQUFDLENBQUMsTUFBTSxDQUFDO1FBQ0wsV0FBVyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUU7UUFDdkIsTUFBTSxFQUFFLG9CQUFvQjtRQUM1QixLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNqQixRQUFRLEVBQUUsT0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUMsQ0FBQyxDQUNMO0NBQ0osQ0FBQyxDQUFBO0FBa0JXLFFBQUEsU0FBUyxHQUFHLElBQUksZ0JBQU0sQ0FBQztJQUNoQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUU7SUFDcEMsdUJBQXVCLEVBQUUsS0FBSztDQUNqQyxDQUFDLENBQUE7QUFFRixNQUFNLElBQUksR0FBRyxpQkFBUyxDQUFDLElBQUksQ0FBQTtBQUVwQixNQUFNLG1DQUFt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QztJQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ3JCLE9BQU8sUUFBUSxDQUFBO0FBQ25CLENBQUMsQ0FBQTtBQUxZLFFBQUEscUJBQXFCLHlCQUtqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSAnb3BlbmFpJ1xuaW1wb3J0IHsgeiB9IGZyb20gJ3pvZCdcbmltcG9ydCB7IHpvZFJlc3BvbnNlRm9ybWF0IH0gZnJvbSAnb3BlbmFpL2hlbHBlcnMvem9kJ1xuaW1wb3J0IHsgQXNzaXN0YW50VG9vbENob2ljZSB9IGZyb20gJ29wZW5haS9yZXNvdXJjZXMvYmV0YS90aHJlYWRzL3RocmVhZHMnXG5pbXBvcnQgeyBzdGF0IH0gZnJvbSAnZnMnXG5pbXBvcnQgeyBDaGF0Rm9jdXMgfSBmcm9tICcuL0FQSSdcblxuY29uc3QgcmVjb21tZW5kYXRpb25BY3Rpb24gPSB6Lm9iamVjdCh7XG4gICAgZGVzY3JpcHRpb246IHouc3RyaW5nKCksXG4gICAgdHJhbnNmZXJzOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBhbW91bnQ6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBmcm9tQWNjb3VudE5hbWU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICB0b0FjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICB9KVxuICAgICksXG59KVxuXG5jb25zdCBSZWNvbW1lbmRhdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogcmVjb21tZW5kYXRpb25BY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHByaW9yaXR5OiB6LmVudW0oWydIaWdoJywgJ01lZGl1bScsICdMb3cnXSksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZmVyIHtcbiAgICBmcm9tQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIHRvQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIGFtb3VudDogc3RyaW5nXG59XG5pbnRlcmZhY2UgUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgIHRyYW5zZmVyczogVHJhbnNmZXJbXVxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWNvbW1lbmRhdGlvbiB7XG4gICAgZXhwbGFuYXRpb246IHN0cmluZ1xuICAgIGFjdGlvbjogUmVjb21tZW5kYXRpb25BY3Rpb25cbiAgICB0aXRsZTogc3RyaW5nXG4gICAgcHJpb3JpdHk6IG51bWJlclxufVxuXG5leHBvcnQgY29uc3QgYXBpQ2xpZW50ID0gbmV3IE9wZW5BSSh7XG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudlsnR3B0U2VjcmV0S2V5J10hLFxuICAgIGRhbmdlcm91c2x5QWxsb3dCcm93c2VyOiBmYWxzZSxcbn0pXG5cbmNvbnN0IGNoYXQgPSBhcGlDbGllbnQuY2hhdFxuXG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zRnJvbURhdGEgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8nLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KFJlY29tbWVuZGF0aW9ucywgJ3JlY29tbWVuZGF0aW9ucycpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5leHBvcnQgY29uc3QgY29tcGxldGVDaGF0RnJvbVByb21wdCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZywgdHlwZTogQ2hhdEZvY3VzIHwgbnVsbCB8IHVuZGVmaW5lZCkgPT4ge1xuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgICAgfSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgZmxhdHRlbiA9ICh2YWx1ZTogYW55KTogYW55W10gPT4ge1xuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgZmxhdHRlbiBlYWNoIGVsZW1lbnQgcmVjdXJzaXZlbHlcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLmZsYXRNYXAoZmxhdHRlbikgLy8gVXNlIGZsYXRNYXAgdG8gZmxhdHRlbiB0aGUgYXJyYXkgcmVjdXJzaXZlbHlcbiAgICB9XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCwgZmxhdHRlbiBpdHMgdmFsdWVzIHJlY3Vyc2l2ZWx5XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZsYXR0ZW4oT2JqZWN0LnZhbHVlcyh2YWx1ZSkpXG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhbiBvYmplY3QsIHJldHVybiBpdCBhcyBhIHNpbmdsZS1lbGVtZW50IGFycmF5XG4gICAgcmV0dXJuIFt2YWx1ZV1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFRlY2huaWNhbFdvcmRzV2hlcmVXZUNhbkdvRGVlcGVyID0gYXN5bmMgKHByb21wdDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAnV2UgYXJlIHN1bW1hcml6aW5nIGZpbmFuY2lhbCBpbmZvcm1hdGlvbiByZXR1cm4gdGhlIGV4YWN0IHBocmFzZXMgKGluY2x1ZGUgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBwdW5jdHVhdGlvbikgd2hlcmUgd2UgY291bGQgZG8gZmluYW5jaWFsIGFuYWx5c2lzIGludG8gdGhlIHRvcGljLiAgcmVzcG9uZCBpbiB0aGUganNvbiBmb3JtYXQgW3BocmFzZTEsIHBocmFzZTJdXScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LnN1YnN0cmluZygwLCAyMDAwMCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogJ2pzb25fb2JqZWN0JyB9LFxuICAgICAgICAgICAgbW9kZWw6ICdncHQtMy41LXR1cmJvJyxcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QganNvbk9iamVjdCA9IEpTT04ucGFyc2UoY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhLmNvbnRlbnQgfHwgJycpXG4gICAgICAgIGlmIChqc29uT2JqZWN0LnBocmFzZTEgfHwganNvbk9iamVjdC5waHJhc2VzIHx8IE9iamVjdC5rZXlzKGpzb25PYmplY3QpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXMoanNvbk9iamVjdCkpXG4gICAgICAgIH0gZWxzZSBpZiAoanNvbk9iamVjdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKGpzb25PYmplY3QpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQXNzaXN0YW50ID0gYXN5bmMgKCkgPT5cbiAgICBhcGlDbGllbnQuYmV0YS5hc3Npc3RhbnRzLmNyZWF0ZSh7XG4gICAgICAgIGluc3RydWN0aW9uczpcbiAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiB3cml0ZSBhbmQgcnVuIGNvZGUgdG8gYW5zd2VyIHRoZSBxdWVzdGlvbi4nLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgdXBsb2FkRmlsZVRvQXNzaXN0YW50ID0gYXN5bmMgKGZpbGU6IEZpbGUpID0+IHtcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnN0IGZpbGVSZXR1cm4gPSBhd2FpdCBhcGlDbGllbnQuZmlsZXMuY3JlYXRlKHtcbiAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgcHVycG9zZTogJ2Fzc2lzdGFudHMnLFxuICAgIH0pXG4gICAgcmV0dXJuIGZpbGVSZXR1cm5cbn1cblxuZXhwb3J0IGNvbnN0IGNvZGVJbnRlcnBlcnRlckZvckFuYWx5c2lzID0gYXN5bmMgKGZpbGVJZHM6IHN0cmluZ1tdLCBhc3Npc3RhbnRfaWQ6IHN0cmluZywgcHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0aHJlYWQgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdCxcbiAgICAgICAgICAgICAgICBhdHRhY2htZW50czogZmlsZUlkcy5tYXAoKGZpbGVJZCkgPT4gKHsgZmlsZV9pZDogZmlsZUlkLCB0b29sczogW3sgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH1dIH0pKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSlcbiAgICByZXR1cm4gdGhyZWFkXG59XG5cbmV4cG9ydCBjb25zdCBydW5UaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZywgYXNzaXN0YW50X2lkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBydW5QYXJhbXMgPSB7XG4gICAgICAgIGFzc2lzdGFudF9pZDogYXNzaXN0YW50X2lkLFxuICAgICAgICB0b29sX2Nob2ljZTogeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfSBhcyBBc3Npc3RhbnRUb29sQ2hvaWNlLFxuICAgIH1cbiAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLnJ1bnMuY3JlYXRlQW5kUG9sbCh0aHJlYWRJZCwgcnVuUGFyYW1zKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2coc3RhdHVzKVxuICAgIHJldHVybiBzdGF0dXNcbn1cblxuZXhwb3J0IGNvbnN0IGxpc3RNZXNzYWdlc0ZvclRocmVhZCA9IGFzeW5jICh0aHJlYWRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLm1lc3NhZ2VzLmxpc3QodGhyZWFkSWQpXG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlcylcbiAgICByZXR1cm4gbWVzc2FnZXNcbn1cbiJdfQ==