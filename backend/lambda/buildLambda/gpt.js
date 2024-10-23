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
    console.log('Sending', prompt, ' to gpt');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUd0RCwrQkFBaUM7QUFFakMsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRixNQUFNLGVBQWUsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQzdCLGVBQWUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNwQixPQUFDLENBQUMsTUFBTSxDQUFDO1FBQ0wsV0FBVyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUU7UUFDdkIsTUFBTSxFQUFFLG9CQUFvQjtRQUM1QixLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNqQixRQUFRLEVBQUUsT0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUMsQ0FBQyxDQUNMO0NBQ0osQ0FBQyxDQUFBO0FBa0JXLFFBQUEsU0FBUyxHQUFHLElBQUksZ0JBQU0sQ0FBQztJQUNoQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUU7SUFDcEMsdUJBQXVCLEVBQUUsS0FBSztDQUNqQyxDQUFDLENBQUE7QUFFRixNQUFNLElBQUksR0FBRyxpQkFBUyxDQUFDLElBQUksQ0FBQTtBQUVwQixNQUFNLG1DQUFt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Q0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUNyRSw2Q0FBNkM7SUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUNyQixPQUFPLFFBQVEsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFMWSxRQUFBLHFCQUFxQix5QkFLakMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSdcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnXG5pbXBvcnQgeyB6b2RSZXNwb25zZUZvcm1hdCB9IGZyb20gJ29wZW5haS9oZWxwZXJzL3pvZCdcbmltcG9ydCB7IEFzc2lzdGFudFRvb2xDaG9pY2UgfSBmcm9tICdvcGVuYWkvcmVzb3VyY2VzL2JldGEvdGhyZWFkcy90aHJlYWRzJ1xuaW1wb3J0IHsgc3RhdCB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgQ2hhdEZvY3VzIH0gZnJvbSAnLi9BUEknXG5cbmNvbnN0IHJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIHRyYW5zZmVyczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgYW1vdW50OiB6LnN0cmluZygpLFxuICAgICAgICAgICAgZnJvbUFjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgdG9BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgUmVjb21tZW5kYXRpb25zID0gei5vYmplY3Qoe1xuICAgIHJlY29tbWVuZGF0aW9uczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgZXhwbGFuYXRpb246IHouc3RyaW5nKCksXG4gICAgICAgICAgICBhY3Rpb246IHJlY29tbWVuZGF0aW9uQWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBwcmlvcml0eTogei5lbnVtKFsnSGlnaCcsICdNZWRpdW0nLCAnTG93J10pLFxuICAgICAgICB9KVxuICAgICksXG59KVxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlciB7XG4gICAgZnJvbUFjY291bnROYW1lOiBzdHJpbmdcbiAgICB0b0FjY291bnROYW1lOiBzdHJpbmdcbiAgICBhbW91bnQ6IHN0cmluZ1xufVxuaW50ZXJmYWNlIFJlY29tbWVuZGF0aW9uQWN0aW9uIHtcbiAgICB0cmFuc2ZlcnM6IFRyYW5zZmVyW11cbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb21tZW5kYXRpb24ge1xuICAgIGV4cGxhbmF0aW9uOiBzdHJpbmdcbiAgICBhY3Rpb246IFJlY29tbWVuZGF0aW9uQWN0aW9uXG4gICAgdGl0bGU6IHN0cmluZ1xuICAgIHByaW9yaXR5OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IGFwaUNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgIGFwaUtleTogcHJvY2Vzcy5lbnZbJ0dwdFNlY3JldEtleSddISxcbiAgICBkYW5nZXJvdXNseUFsbG93QnJvd3NlcjogZmFsc2UsXG59KVxuXG5jb25zdCBjaGF0ID0gYXBpQ2xpZW50LmNoYXRcblxuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc0Zyb21EYXRhID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChSZWNvbW1lbmRhdGlvbnMsICdyZWNvbW1lbmRhdGlvbnMnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBsZXRlQ2hhdEZyb21Qcm9tcHQgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcsIHR5cGU6IENoYXRGb2N1cyB8IG51bGwgfCB1bmRlZmluZWQpID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VuZGluZycsIHByb21wdCwgJyB0byBncHQnKVxuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgICAgfSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgZmxhdHRlbiA9ICh2YWx1ZTogYW55KTogYW55W10gPT4ge1xuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgZmxhdHRlbiBlYWNoIGVsZW1lbnQgcmVjdXJzaXZlbHlcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLmZsYXRNYXAoZmxhdHRlbikgLy8gVXNlIGZsYXRNYXAgdG8gZmxhdHRlbiB0aGUgYXJyYXkgcmVjdXJzaXZlbHlcbiAgICB9XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCwgZmxhdHRlbiBpdHMgdmFsdWVzIHJlY3Vyc2l2ZWx5XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZsYXR0ZW4oT2JqZWN0LnZhbHVlcyh2YWx1ZSkpXG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhbiBvYmplY3QsIHJldHVybiBpdCBhcyBhIHNpbmdsZS1lbGVtZW50IGFycmF5XG4gICAgcmV0dXJuIFt2YWx1ZV1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFRlY2huaWNhbFdvcmRzV2hlcmVXZUNhbkdvRGVlcGVyID0gYXN5bmMgKHByb21wdDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAnV2UgYXJlIHN1bW1hcml6aW5nIGZpbmFuY2lhbCBpbmZvcm1hdGlvbiByZXR1cm4gdGhlIGV4YWN0IHBocmFzZXMgKGluY2x1ZGUgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBwdW5jdHVhdGlvbikgd2hlcmUgd2UgY291bGQgZG8gZmluYW5jaWFsIGFuYWx5c2lzIGludG8gdGhlIHRvcGljLiAgcmVzcG9uZCBpbiB0aGUganNvbiBmb3JtYXQgW3BocmFzZTEsIHBocmFzZTJdXScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LnN1YnN0cmluZygwLCAyMDAwMCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogJ2pzb25fb2JqZWN0JyB9LFxuICAgICAgICAgICAgbW9kZWw6ICdncHQtMy41LXR1cmJvJyxcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QganNvbk9iamVjdCA9IEpTT04ucGFyc2UoY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhLmNvbnRlbnQgfHwgJycpXG4gICAgICAgIGlmIChqc29uT2JqZWN0LnBocmFzZTEgfHwganNvbk9iamVjdC5waHJhc2VzIHx8IE9iamVjdC5rZXlzKGpzb25PYmplY3QpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXMoanNvbk9iamVjdCkpXG4gICAgICAgIH0gZWxzZSBpZiAoanNvbk9iamVjdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKGpzb25PYmplY3QpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQXNzaXN0YW50ID0gYXN5bmMgKCkgPT5cbiAgICBhcGlDbGllbnQuYmV0YS5hc3Npc3RhbnRzLmNyZWF0ZSh7XG4gICAgICAgIGluc3RydWN0aW9uczpcbiAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiB3cml0ZSBhbmQgcnVuIGNvZGUgdG8gYW5zd2VyIHRoZSBxdWVzdGlvbi4nLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgdXBsb2FkRmlsZVRvQXNzaXN0YW50ID0gYXN5bmMgKGZpbGU6IEZpbGUpID0+IHtcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnN0IGZpbGVSZXR1cm4gPSBhd2FpdCBhcGlDbGllbnQuZmlsZXMuY3JlYXRlKHtcbiAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgcHVycG9zZTogJ2Fzc2lzdGFudHMnLFxuICAgIH0pXG4gICAgcmV0dXJuIGZpbGVSZXR1cm5cbn1cblxuZXhwb3J0IGNvbnN0IGNvZGVJbnRlcnBlcnRlckZvckFuYWx5c2lzID0gYXN5bmMgKGZpbGVJZHM6IHN0cmluZ1tdLCBhc3Npc3RhbnRfaWQ6IHN0cmluZywgcHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0aHJlYWQgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdCxcbiAgICAgICAgICAgICAgICBhdHRhY2htZW50czogZmlsZUlkcy5tYXAoKGZpbGVJZCkgPT4gKHsgZmlsZV9pZDogZmlsZUlkLCB0b29sczogW3sgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH1dIH0pKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSlcbiAgICByZXR1cm4gdGhyZWFkXG59XG5cbmV4cG9ydCBjb25zdCBydW5UaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZywgYXNzaXN0YW50X2lkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBydW5QYXJhbXMgPSB7XG4gICAgICAgIGFzc2lzdGFudF9pZDogYXNzaXN0YW50X2lkLFxuICAgICAgICB0b29sX2Nob2ljZTogeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfSBhcyBBc3Npc3RhbnRUb29sQ2hvaWNlLFxuICAgIH1cbiAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLnJ1bnMuY3JlYXRlQW5kUG9sbCh0aHJlYWRJZCwgcnVuUGFyYW1zKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2coc3RhdHVzKVxuICAgIHJldHVybiBzdGF0dXNcbn1cblxuZXhwb3J0IGNvbnN0IGxpc3RNZXNzYWdlc0ZvclRocmVhZCA9IGFzeW5jICh0aHJlYWRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLm1lc3NhZ2VzLmxpc3QodGhyZWFkSWQpXG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlcylcbiAgICByZXR1cm4gbWVzc2FnZXNcbn1cbiJdfQ==