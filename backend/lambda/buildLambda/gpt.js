"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessagesForThread = exports.runThread = exports.codeInterperterForAnalysis = exports.uploadFileToAssistant = exports.createAssistant = exports.getTechnicalWordsWhereWeCanGoDeeper = exports.getNeededInformationFromModel = exports.getDateRangeFromModel = exports.InformationOptions = exports.completeChatFromPrompt = exports.getFinancialRecommendationsFromData = exports.apiClient = void 0;
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
var InformationOptions;
(function (InformationOptions) {
    InformationOptions[InformationOptions["INVESTMENTS"] = 0] = "INVESTMENTS";
    InformationOptions[InformationOptions["TRANSACTIONS"] = 1] = "TRANSACTIONS";
    InformationOptions[InformationOptions["BANKACCOUNTS"] = 2] = "BANKACCOUNTS";
})(InformationOptions || (exports.InformationOptions = InformationOptions = {}));
function getFormattedCurrentDate() {
    const now = new Date(); // Get the current date and time
    // Extract year, month, and day
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(now.getDate()).padStart(2, '0');
    // Return the formatted date as 'YYYY-MM-DD'
    return `${year}-${month}-${day}`;
}
const getDateRangeFromModel = async (prompt) => {
    const AcceptableValuesForDateRange = zod_1.z.object({
        startDay: zod_1.z.object({
            day: zod_1.z.number(),
            month: zod_1.z.number(),
            year: zod_1.z.number(),
        }),
        endDay: zod_1.z.object({
            day: zod_1.z.number(),
            month: zod_1.z.number(),
            year: zod_1.z.number(),
        }),
        hasNoTimeConstraint: zod_1.z.boolean(),
    });
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'user',
                content: 'The current date is ' +
                    getFormattedCurrentDate() +
                    ' Fill out the best suited date range for the following query: ' +
                    prompt.substring(0, 100),
            },
        ],
        model: 'gpt-4o-mini',
        response_format: (0, zod_2.zodResponseFormat)(AcceptableValuesForDateRange, 'dateRange'),
    });
    return chatOutput.choices[0].message;
};
exports.getDateRangeFromModel = getDateRangeFromModel;
const getNeededInformationFromModel = async (prompt) => {
    console.log('Getting needed information');
    const AcceptableInformationOptions = zod_1.z.object({
        optionsForInformation: zod_1.z.array(zod_1.z.enum(['INVESTMENTS', 'TRANSACTIONS', 'BANKACCOUNTS'])),
    });
    const chatOutput = await chat.completions.create({
        messages: [
            {
                role: 'user',
                content: 'What information is best suited to answer the following query: ' + prompt.substring(0, 100),
            },
        ],
        model: 'gpt-4o-mini',
        response_format: (0, zod_2.zodResponseFormat)(AcceptableInformationOptions, 'dateRange'),
    });
    return chatOutput.choices[0].message;
};
exports.getNeededInformationFromModel = getNeededInformationFromModel;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUd0RCwrQkFBaUM7QUFFakMsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRixNQUFNLGVBQWUsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQzdCLGVBQWUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNwQixPQUFDLENBQUMsTUFBTSxDQUFDO1FBQ0wsV0FBVyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUU7UUFDdkIsTUFBTSxFQUFFLG9CQUFvQjtRQUM1QixLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNqQixRQUFRLEVBQUUsT0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUMsQ0FBQyxDQUNMO0NBQ0osQ0FBQyxDQUFBO0FBa0JXLFFBQUEsU0FBUyxHQUFHLElBQUksZ0JBQU0sQ0FBQztJQUNoQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUU7SUFDcEMsdUJBQXVCLEVBQUUsS0FBSztDQUNqQyxDQUFDLENBQUE7QUFFRixNQUFNLElBQUksR0FBRyxpQkFBUyxDQUFDLElBQUksQ0FBQTtBQUVwQixNQUFNLG1DQUFt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Q0FBQTtJQUNuRiw2Q0FBNkM7SUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNuQixPQUFPLE1BQU0sQ0FBQTtBQUNqQixDQUFDLENBQUE7QUFUWSxRQUFBLFNBQVMsYUFTckI7QUFFTSxNQUFNLHFCQUFxQixHQUFHLEtBQUssRUFBRSxRQUFnQixFQUFFLEVBQUU7SUFDNUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxpQkFBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUNyRSw2Q0FBNkM7SUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUNyQixPQUFPLFFBQVEsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFMWSxRQUFBLHFCQUFxQix5QkFLakMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSdcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnXG5pbXBvcnQgeyB6b2RSZXNwb25zZUZvcm1hdCB9IGZyb20gJ29wZW5haS9oZWxwZXJzL3pvZCdcbmltcG9ydCB7IEFzc2lzdGFudFRvb2xDaG9pY2UgfSBmcm9tICdvcGVuYWkvcmVzb3VyY2VzL2JldGEvdGhyZWFkcy90aHJlYWRzJ1xuaW1wb3J0IHsgc3RhdCB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgQ2hhdEZvY3VzIH0gZnJvbSAnLi9BUEknXG5cbmNvbnN0IHJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIHRyYW5zZmVyczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgYW1vdW50OiB6LnN0cmluZygpLFxuICAgICAgICAgICAgZnJvbUFjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgdG9BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgUmVjb21tZW5kYXRpb25zID0gei5vYmplY3Qoe1xuICAgIHJlY29tbWVuZGF0aW9uczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgZXhwbGFuYXRpb246IHouc3RyaW5nKCksXG4gICAgICAgICAgICBhY3Rpb246IHJlY29tbWVuZGF0aW9uQWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBwcmlvcml0eTogei5lbnVtKFsnSGlnaCcsICdNZWRpdW0nLCAnTG93J10pLFxuICAgICAgICB9KVxuICAgICksXG59KVxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlciB7XG4gICAgZnJvbUFjY291bnROYW1lOiBzdHJpbmdcbiAgICB0b0FjY291bnROYW1lOiBzdHJpbmdcbiAgICBhbW91bnQ6IHN0cmluZ1xufVxuaW50ZXJmYWNlIFJlY29tbWVuZGF0aW9uQWN0aW9uIHtcbiAgICB0cmFuc2ZlcnM6IFRyYW5zZmVyW11cbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb21tZW5kYXRpb24ge1xuICAgIGV4cGxhbmF0aW9uOiBzdHJpbmdcbiAgICBhY3Rpb246IFJlY29tbWVuZGF0aW9uQWN0aW9uXG4gICAgdGl0bGU6IHN0cmluZ1xuICAgIHByaW9yaXR5OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IGFwaUNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgIGFwaUtleTogcHJvY2Vzcy5lbnZbJ0dwdFNlY3JldEtleSddISxcbiAgICBkYW5nZXJvdXNseUFsbG93QnJvd3NlcjogZmFsc2UsXG59KVxuXG5jb25zdCBjaGF0ID0gYXBpQ2xpZW50LmNoYXRcblxuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc0Zyb21EYXRhID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChSZWNvbW1lbmRhdGlvbnMsICdyZWNvbW1lbmRhdGlvbnMnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBsZXRlQ2hhdEZyb21Qcm9tcHQgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcsIHR5cGU6IENoYXRGb2N1cyB8IG51bGwgfCB1bmRlZmluZWQpID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VuZGluZycsIHByb21wdCwgJyB0byBncHQnKVxuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgY29udGVudDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgICAgfSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuZXhwb3J0IGVudW0gSW5mb3JtYXRpb25PcHRpb25zIHtcbiAgICAnSU5WRVNUTUVOVFMnLFxuICAgICdUUkFOU0FDVElPTlMnLFxuICAgICdCQU5LQUNDT1VOVFMnLFxufVxuZXhwb3J0IGludGVyZmFjZSBHcHREYXRlUmVzcG9uc2Uge1xuICAgIGRheTogbnVtYmVyXG4gICAgbW9udGg6IG51bWJlclxuICAgIHllYXI6IG51bWJlclxufVxuZXhwb3J0IGludGVyZmFjZSBEYXRhUmFuZ2VSZXNwb25zZSB7XG4gICAgc3RhcnREYXk6IEdwdERhdGVSZXNwb25zZVxuICAgIGVuZERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgaGFzTm9UaW1lQ29uc3RyYWludDogYm9vbGVhblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZm9ybWF0aW9uT3B0aW9uc1Jlc3BvbnNlIHtcbiAgICBvcHRpb25zRm9ySW5mb3JtYXRpb246IEluZm9ybWF0aW9uT3B0aW9uc1tdXG59XG5cbmZ1bmN0aW9uIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKSAvLyBHZXQgdGhlIGN1cnJlbnQgZGF0ZSBhbmQgdGltZVxuXG4gICAgLy8gRXh0cmFjdCB5ZWFyLCBtb250aCwgYW5kIGRheVxuICAgIGNvbnN0IHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKVxuICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKG5vdy5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKSAvLyBNb250aHMgYXJlIDAtYmFzZWQsIHNvIGFkZCAxXG4gICAgY29uc3QgZGF5ID0gU3RyaW5nKG5vdy5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJylcblxuICAgIC8vIFJldHVybiB0aGUgZm9ybWF0dGVkIGRhdGUgYXMgJ1lZWVktTU0tREQnXG4gICAgcmV0dXJuIGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fWBcbn1cblxuZXhwb3J0IGNvbnN0IGdldERhdGVSYW5nZUZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IEFjY2VwdGFibGVWYWx1ZXNGb3JEYXRlUmFuZ2UgPSB6Lm9iamVjdCh7XG4gICAgICAgIHN0YXJ0RGF5OiB6Lm9iamVjdCh7XG4gICAgICAgICAgICBkYXk6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBtb250aDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIHllYXI6IHoubnVtYmVyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBlbmREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGhhc05vVGltZUNvbnN0cmFpbnQ6IHouYm9vbGVhbigpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgJ1RoZSBjdXJyZW50IGRhdGUgaXMgJyArXG4gICAgICAgICAgICAgICAgICAgIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCkgK1xuICAgICAgICAgICAgICAgICAgICAnIEZpbGwgb3V0IHRoZSBiZXN0IHN1aXRlZCBkYXRlIHJhbmdlIGZvciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiAnICtcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LnN1YnN0cmluZygwLCAxMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSwgJ2RhdGVSYW5nZScpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5leHBvcnQgY29uc3QgZ2V0TmVlZGVkSW5mb3JtYXRpb25Gcm9tTW9kZWwgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZyBuZWVkZWQgaW5mb3JtYXRpb24nKVxuICAgIGNvbnN0IEFjY2VwdGFibGVJbmZvcm1hdGlvbk9wdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogei5hcnJheSh6LmVudW0oWydJTlZFU1RNRU5UUycsICdUUkFOU0FDVElPTlMnLCAnQkFOS0FDQ09VTlRTJ10pKSxcbiAgICB9KVxuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdXaGF0IGluZm9ybWF0aW9uIGlzIGJlc3Qgc3VpdGVkIHRvIGFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiAnICsgcHJvbXB0LnN1YnN0cmluZygwLCAxMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoQWNjZXB0YWJsZUluZm9ybWF0aW9uT3B0aW9ucywgJ2RhdGVSYW5nZScpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5jb25zdCBmbGF0dGVuID0gKHZhbHVlOiBhbnkpOiBhbnlbXSA9PiB7XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBmbGF0dGVuIGVhY2ggZWxlbWVudCByZWN1cnNpdmVseVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUuZmxhdE1hcChmbGF0dGVuKSAvLyBVc2UgZmxhdE1hcCB0byBmbGF0dGVuIHRoZSBhcnJheSByZWN1cnNpdmVseVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0LCBmbGF0dGVuIGl0cyB2YWx1ZXMgcmVjdXJzaXZlbHlcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKHZhbHVlKSlcbiAgICB9XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIG5laXRoZXIgYW4gYXJyYXkgbm9yIGFuIG9iamVjdCwgcmV0dXJuIGl0IGFzIGEgc2luZ2xlLWVsZW1lbnQgYXJyYXlcbiAgICByZXR1cm4gW3ZhbHVlXVxufVxuXG5leHBvcnQgY29uc3QgZ2V0VGVjaG5pY2FsV29yZHNXaGVyZVdlQ2FuR29EZWVwZXIgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgICdXZSBhcmUgc3VtbWFyaXppbmcgZmluYW5jaWFsIGluZm9ybWF0aW9uIHJldHVybiB0aGUgZXhhY3QgcGhyYXNlcyAoaW5jbHVkZSBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIHB1bmN0dWF0aW9uKSB3aGVyZSB3ZSBjb3VsZCBkbyBmaW5hbmNpYWwgYW5hbHlzaXMgaW50byB0aGUgdG9waWMuICByZXNwb25kIGluIHRoZSBqc29uIGZvcm1hdCBbcGhyYXNlMSwgcGhyYXNlMl1dJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogeyB0eXBlOiAnanNvbl9vYmplY3QnIH0sXG4gICAgICAgICAgICBtb2RlbDogJ2dwdC0zLjUtdHVyYm8nLFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBqc29uT2JqZWN0ID0gSlNPTi5wYXJzZShjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSEuY29udGVudCB8fCAnJylcbiAgICAgICAgaWYgKGpzb25PYmplY3QucGhyYXNlMSB8fCBqc29uT2JqZWN0LnBocmFzZXMgfHwgT2JqZWN0LmtleXMoanNvbk9iamVjdCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZsYXR0ZW4oT2JqZWN0LnZhbHVlcyhqc29uT2JqZWN0KSlcbiAgICAgICAgfSBlbHNlIGlmIChqc29uT2JqZWN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZsYXR0ZW4oanNvbk9iamVjdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gW11cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVBc3Npc3RhbnQgPSBhc3luYyAoKSA9PlxuICAgIGFwaUNsaWVudC5iZXRhLmFzc2lzdGFudHMuY3JlYXRlKHtcbiAgICAgICAgaW5zdHJ1Y3Rpb25zOlxuICAgICAgICAgICAgJ1lvdSBhcmUgYSBwZXJzb25hbCBmaW5hbmNlIGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIHdyaXRlIGFuZCBydW4gY29kZSB0byBhbnN3ZXIgdGhlIHF1ZXN0aW9uLicsXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgICB0b29sczogW3sgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH1dLFxuICAgIH0pXG5cbmV4cG9ydCBjb25zdCB1cGxvYWRGaWxlVG9Bc3Npc3RhbnQgPSBhc3luYyAoZmlsZTogRmlsZSkgPT4ge1xuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc3QgZmlsZVJldHVybiA9IGF3YWl0IGFwaUNsaWVudC5maWxlcy5jcmVhdGUoe1xuICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICBwdXJwb3NlOiAnYXNzaXN0YW50cycsXG4gICAgfSlcbiAgICByZXR1cm4gZmlsZVJldHVyblxufVxuXG5leHBvcnQgY29uc3QgY29kZUludGVycGVydGVyRm9yQW5hbHlzaXMgPSBhc3luYyAoZmlsZUlkczogc3RyaW5nW10sIGFzc2lzdGFudF9pZDogc3RyaW5nLCBwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHRocmVhZCA9IGF3YWl0IGFwaUNsaWVudC5iZXRhLnRocmVhZHMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LFxuICAgICAgICAgICAgICAgIGF0dGFjaG1lbnRzOiBmaWxlSWRzLm1hcCgoZmlsZUlkKSA9PiAoeyBmaWxlX2lkOiBmaWxlSWQsIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0gfSkpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9KVxuICAgIHJldHVybiB0aHJlYWRcbn1cblxuZXhwb3J0IGNvbnN0IHJ1blRocmVhZCA9IGFzeW5jICh0aHJlYWRJZDogc3RyaW5nLCBhc3Npc3RhbnRfaWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHJ1blBhcmFtcyA9IHtcbiAgICAgICAgYXNzaXN0YW50X2lkOiBhc3Npc3RhbnRfaWQsXG4gICAgICAgIHRvb2xfY2hvaWNlOiB7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9IGFzIEFzc2lzdGFudFRvb2xDaG9pY2UsXG4gICAgfVxuICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGFwaUNsaWVudC5iZXRhLnRocmVhZHMucnVucy5jcmVhdGVBbmRQb2xsKHRocmVhZElkLCBydW5QYXJhbXMpXG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zb2xlLmxvZyhzdGF0dXMpXG4gICAgcmV0dXJuIHN0YXR1c1xufVxuXG5leHBvcnQgY29uc3QgbGlzdE1lc3NhZ2VzRm9yVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBtZXNzYWdlcyA9IGF3YWl0IGFwaUNsaWVudC5iZXRhLnRocmVhZHMubWVzc2FnZXMubGlzdCh0aHJlYWRJZClcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2VzKVxuICAgIHJldHVybiBtZXNzYWdlc1xufVxuIl19