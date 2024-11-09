"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatToUI = exports.listMessagesForThread = exports.runThread = exports.codeInterperterForAnalysis = exports.uploadFileToAssistant = exports.createAssistant = exports.getTechnicalWordsWhereWeCanGoDeeper = exports.getNeededInformationFromModel = exports.getDateRangeFromModel = exports.InformationOptions = exports.completeChatFromPrompt = exports.getFinancialRecommendationsFromData = exports.apiClient = void 0;
const openai_1 = require("openai");
const zod_1 = require("zod");
const zod_2 = require("openai/helpers/zod");
const API_1 = require("./API");
const mutations_1 = require("./graphql/mutations");
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
const aws4 = require("aws4");
const stockPrompts_1 = require("./stockPrompts");
const appsyncUrl = process.env.APPSYNC_URL;
const apiKey = process.env.APPSYNC_API_KEY;
const recommendationAction = zod_1.z.object({
    description: zod_1.z.string(),
    transfers: zod_1.z.array(zod_1.z.object({
        amount: zod_1.z.string(),
        fromAccountName: zod_1.z.string(),
        toAccountName: zod_1.z.string(),
    })),
});
/**
 * highLevelCategory: HighLevelTransactionCategory
    timeframe: BudgetTimeframe
    spendingThreshold: Float
    createdAt: String
    specificPayeeRegex: String
 */
const categories = Object.keys(API_1.HighLevelTransactionCategory).filter((key) => isNaN(Number(key)));
const tupleValues = categories;
const transactionRecommendationAction = zod_1.z.object({
    description: zod_1.z.string(),
    budget: zod_1.z.array(zod_1.z.object({
        timeframe: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
        spendingThreshold: zod_1.z.number(),
        highLevelCategory: zod_1.z.enum(tupleValues),
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
const TransactionRecommendation = zod_1.z.object({
    recommendations: zod_1.z.array(zod_1.z.object({
        explanation: zod_1.z.string(),
        action: transactionRecommendationAction,
        title: zod_1.z.string(),
        priority: zod_1.z.enum(['High', 'Medium', 'Low']),
    })),
});
/**
 *
 * type GraphType {
    pieChart: String
    barChart: String
    histogram: String
    timePlot: String
}
 * type PremiumChatResponse {
    response: String
    graphs: GraphType
 */
const PremiumChatResponse = zod_1.z.object({
    response: zod_1.z.string(),
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
const makePerplexityCall = async (body) => {
    delete body['response_format'];
    delete body['stream'];
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: process.env.PerplexitySecretKey,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error('Error Response:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    try {
        return await response.json();
    }
    catch (error) {
        const responseText = await response.text();
        console.error('Failed to parse JSON. Response was:', responseText);
        throw new Error('API returned non-JSON response');
    }
};
const completeChatFromPrompt = async (prompt, type, userId, requiresLiveData, chatType) => {
    console.log('Sending', prompt, ' to gpt');
    const systemPrompt = chatType === API_1.ChatType.FinancialNewsQuery
        ? stockPrompts_1.newsPrompt
        : chatType === API_1.ChatType.FinancialAnalysisQuery
            ? stockPrompts_1.technicalPrompt
            : chatType === API_1.ChatType.TransactionRecommendation
                ? `You are a personal spending assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. You provide spending recommendations which are highly useful.`
                : `You are a personal ${type && type !== API_1.ChatFocus.All ? type : 'Finance'} assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. `;
    const model = chatType === API_1.ChatType.FinancialNewsQuery || chatType === API_1.ChatType.FinancialAnalysisQuery
        ? 'llama-3.1-sonar-large-128k-online'
        : 'gpt-4o';
    const messageBody = {
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: prompt.substring(0, 20000),
            },
        ],
        response_format: chatType === API_1.ChatType.TransactionRecommendation
            ? (0, zod_2.zodResponseFormat)(TransactionRecommendation, 'recommendations')
            : undefined,
        model,
        stream: true,
    };
    const stream = requiresLiveData
        ? await makePerplexityCall(messageBody)
        : await chat.completions.create(messageBody);
    let message = [];
    let count = 0;
    let buffer = [];
    const firstFewLimit = 3; // Send the first 3 chunks immediately
    const batchSize = 100; // Then combine 10 chunks at a time
    const messageId = userId + '#' + Date.now().toString();
    if (!requiresLiveData) {
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            // For the first few chunks, send immediately
            if (count < firstFewLimit) {
                console.info('Got:', content);
                message.push(content);
                (0, exports.sendChatToUI)(userId, count.toString(), content, false, messageId);
                count = count + 1;
            }
            else {
                // After the first few, accumulate chunks in a buffer
                buffer.push(content);
                // Once we've accumulated enough chunks (batchSize), send them as one combined message
                if (buffer.length === batchSize) {
                    const combinedMessage = buffer.join('');
                    console.info('Sending combined message:', combinedMessage);
                    (0, exports.sendChatToUI)(userId, count.toString(), combinedMessage, false, messageId);
                    message.push(combinedMessage);
                    // Reset the buffer after sending
                    buffer = [];
                    count = count + 1;
                }
                // Increment the counter even when buffering
            }
        }
    }
    else {
        message = [stream?.choices[0].message.content || ''];
    }
    // If there are any remaining chunks in the buffer after the loop ends, send them
    if (buffer.length > 0) {
        const combinedMessage = buffer.join('');
        console.info('Sending final combined message:', combinedMessage);
        (0, exports.sendChatToUI)(userId, count.toString(), combinedMessage, true, messageId);
        message.push(combinedMessage);
    }
    else {
        (0, exports.sendChatToUI)(userId, count.toString(), '', true, messageId);
    }
    return message.join('');
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
const sendChatToUI = async (pk, sk, message, isLastChunk, messageId) => {
    const chatInput = {
        pk: pk,
        sk: sk,
        message: message,
        time: Date.now().toString(),
        isLastChunk,
        messageId,
    };
    // Prepare GraphQL request payload
    const graphqlData = {
        query: mutations_1.createChat,
        variables: {
            chat: chatInput,
        },
    };
    const postBody = JSON.stringify(graphqlData);
    try {
        const credentials = await (0, credential_provider_node_1.defaultProvider)()();
        const uri = new URL(appsyncUrl);
        const httpRequest = {
            hostname: uri.hostname,
            path: uri.pathname,
            method: 'POST',
            headers: {
                host: uri.hostname,
                'Content-Type': 'application/json',
            },
            body: postBody,
        };
        // Create a signer object
        const signer = aws4.sign({
            region: 'ca-central-1',
            service: 'appsync', // AppSync is the service we're interacting with
            path: httpRequest.path,
            headers: httpRequest.headers,
            method: httpRequest.method,
            body: httpRequest.body,
        }, {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
        });
        // Sign the request
        Object.assign(httpRequest.headers, signer.headers);
        // Make the HTTP request
        const response = await fetch(uri.href, httpRequest);
        const json = await response.json();
        console.log(`JSON Response = ${JSON.stringify(json, null, 2)}`);
    }
    catch (error) {
        console.error(`FETCH ERROR: ${JSON.stringify(error, null, 2)}`);
    }
};
exports.sendChatToUI = sendChatToUI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUV0RCwrQkFBb0Y7QUFDcEYsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFDNUIsaURBQTREO0FBQzVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsR0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLGtDQUE0QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxRyxNQUFNLFdBQVcsR0FBRyxVQUFtQyxDQUFBO0FBRXZELE1BQU0sK0JBQStCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxXQUFXLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN2QixNQUFNLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FDWCxPQUFDLENBQUMsTUFBTSxDQUFDO1FB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cG9ydCB7IHogfSBmcm9tICd6b2QnXG5pbXBvcnQgeyB6b2RSZXNwb25zZUZvcm1hdCB9IGZyb20gJ29wZW5haS9oZWxwZXJzL3pvZCdcbmltcG9ydCB7IEFzc2lzdGFudFRvb2xDaG9pY2UgfSBmcm9tICdvcGVuYWkvcmVzb3VyY2VzL2JldGEvdGhyZWFkcy90aHJlYWRzJ1xuaW1wb3J0IHsgQ2hhdEZvY3VzLCBDaGF0SW5wdXQsIENoYXRUeXBlLCBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5IH0gZnJvbSAnLi9BUEknXG5pbXBvcnQgeyBjcmVhdGVDaGF0IH0gZnJvbSAnLi9ncmFwaHFsL211dGF0aW9ucydcbmltcG9ydCB7IGRlZmF1bHRQcm92aWRlciB9IGZyb20gJ0Bhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXItbm9kZSdcbmltcG9ydCAqIGFzIGF3czQgZnJvbSAnYXdzNCdcbmltcG9ydCB7IG5ld3NQcm9tcHQsIHRlY2huaWNhbFByb21wdCB9IGZyb20gJy4vc3RvY2tQcm9tcHRzJ1xuY29uc3QgYXBwc3luY1VybCA9IHByb2Nlc3MuZW52LkFQUFNZTkNfVVJMIGFzIHN0cmluZ1xuY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19BUElfS0VZIGFzIHN0cmluZ1xuXG5jb25zdCByZWNvbW1lbmRhdGlvbkFjdGlvbiA9IHoub2JqZWN0KHtcbiAgICBkZXNjcmlwdGlvbjogei5zdHJpbmcoKSxcbiAgICB0cmFuc2ZlcnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGFtb3VudDogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGZyb21BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHRvQWNjb3VudE5hbWU6IHouc3RyaW5nKCksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbi8qKlxuICogaGlnaExldmVsQ2F0ZWdvcnk6IEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnlcbiAgICB0aW1lZnJhbWU6IEJ1ZGdldFRpbWVmcmFtZVxuICAgIHNwZW5kaW5nVGhyZXNob2xkOiBGbG9hdFxuICAgIGNyZWF0ZWRBdDogU3RyaW5nXG4gICAgc3BlY2lmaWNQYXllZVJlZ2V4OiBTdHJpbmdcbiAqL1xuY29uc3QgY2F0ZWdvcmllczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyhIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5KS5maWx0ZXIoKGtleSkgPT4gaXNOYU4oTnVtYmVyKGtleSkpKVxuY29uc3QgdHVwbGVWYWx1ZXMgPSBjYXRlZ29yaWVzIGFzIFtzdHJpbmcsIC4uLnN0cmluZ1tdXVxuXG5jb25zdCB0cmFuc2FjdGlvblJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIGJ1ZGdldDogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgdGltZWZyYW1lOiB6LmVudW0oWydEQUlMWScsICdXRUVLTFknLCAnTU9OVEhMWSddKSxcbiAgICAgICAgICAgIHNwZW5kaW5nVGhyZXNob2xkOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgaGlnaExldmVsQ2F0ZWdvcnk6IHouZW51bSh0dXBsZVZhbHVlcyksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFJlY29tbWVuZGF0aW9ucyA9IHoub2JqZWN0KHtcbiAgICByZWNvbW1lbmRhdGlvbnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgYWN0aW9uOiByZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgVHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbiA9IHoub2JqZWN0KHtcbiAgICByZWNvbW1lbmRhdGlvbnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgYWN0aW9uOiB0cmFuc2FjdGlvblJlY29tbWVuZGF0aW9uQWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBwcmlvcml0eTogei5lbnVtKFsnSGlnaCcsICdNZWRpdW0nLCAnTG93J10pLFxuICAgICAgICB9KVxuICAgICksXG59KVxuXG4vKipcbiAqIFxuICogdHlwZSBHcmFwaFR5cGUge1xuICAgIHBpZUNoYXJ0OiBTdHJpbmdcbiAgICBiYXJDaGFydDogU3RyaW5nXG4gICAgaGlzdG9ncmFtOiBTdHJpbmdcbiAgICB0aW1lUGxvdDogU3RyaW5nXG59XG4gKiB0eXBlIFByZW1pdW1DaGF0UmVzcG9uc2Uge1xuICAgIHJlc3BvbnNlOiBTdHJpbmdcbiAgICBncmFwaHM6IEdyYXBoVHlwZVxuICovXG5cbmNvbnN0IFByZW1pdW1DaGF0UmVzcG9uc2UgPSB6Lm9iamVjdCh7XG4gICAgcmVzcG9uc2U6IHouc3RyaW5nKCksXG59KVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZmVyIHtcbiAgICBmcm9tQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIHRvQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIGFtb3VudDogc3RyaW5nXG59XG5pbnRlcmZhY2UgUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgIHRyYW5zZmVyczogVHJhbnNmZXJbXVxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWNvbW1lbmRhdGlvbiB7XG4gICAgZXhwbGFuYXRpb246IHN0cmluZ1xuICAgIGFjdGlvbjogUmVjb21tZW5kYXRpb25BY3Rpb25cbiAgICB0aXRsZTogc3RyaW5nXG4gICAgcHJpb3JpdHk6IG51bWJlclxufVxuXG5leHBvcnQgY29uc3QgYXBpQ2xpZW50ID0gbmV3IE9wZW5BSSh7XG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudlsnR3B0U2VjcmV0S2V5J10hLFxuICAgIGRhbmdlcm91c2x5QWxsb3dCcm93c2VyOiBmYWxzZSxcbn0pXG5cbmNvbnN0IGNoYXQgPSBhcGlDbGllbnQuY2hhdFxuXG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zRnJvbURhdGEgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8nLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KFJlY29tbWVuZGF0aW9ucywgJ3JlY29tbWVuZGF0aW9ucycpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5jb25zdCBtYWtlUGVycGxleGl0eUNhbGwgPSBhc3luYyAoYm9keTogYW55KSA9PiB7XG4gICAgZGVsZXRlIGJvZHlbJ3Jlc3BvbnNlX2Zvcm1hdCddXG4gICAgZGVsZXRlIGJvZHlbJ3N0cmVhbSddXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucGVycGxleGl0eS5haS9jaGF0L2NvbXBsZXRpb25zJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IHByb2Nlc3MuZW52LlBlcnBsZXhpdHlTZWNyZXRLZXksXG4gICAgICAgIH0gYXMgYW55LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICB9KVxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgLy8gTG9nIHRoZSBlcnJvciByZXNwb25zZSBmb3IgZGVidWdnaW5nXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBSZXNwb25zZTonLCBlcnJvclRleHQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIHJlcXVlc3QgZmFpbGVkIHdpdGggc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHR9YClcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBKU09OLiBSZXNwb25zZSB3YXM6JywgcmVzcG9uc2VUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FQSSByZXR1cm5lZCBub24tSlNPTiByZXNwb25zZScpXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGxldGVDaGF0RnJvbVByb21wdCA9IGFzeW5jIChcbiAgICBwcm9tcHQ6IHN0cmluZyxcbiAgICB0eXBlOiBDaGF0Rm9jdXMgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHJlcXVpcmVzTGl2ZURhdGE6IGJvb2xlYW4sXG4gICAgY2hhdFR5cGU6IENoYXRUeXBlXG4pID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VuZGluZycsIHByb21wdCwgJyB0byBncHQnKVxuICAgIGNvbnN0IHN5c3RlbVByb21wdCA9XG4gICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnlcbiAgICAgICAgICAgID8gbmV3c1Byb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyB0ZWNobmljYWxQcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgID8gYFlvdSBhcmUgYSBwZXJzb25hbCBzcGVuZGluZyBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBZb3UgcHJvdmlkZSBzcGVuZGluZyByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwuYFxuICAgICAgICAgICAgOiBgWW91IGFyZSBhIHBlcnNvbmFsICR7XG4gICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgIH0gYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gYFxuICAgIGNvbnN0IG1vZGVsID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeSB8fCBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyAnbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lJ1xuICAgICAgICAgICAgOiAnZ3B0LTRvJ1xuICAgIGNvbnN0IG1lc3NhZ2VCb2R5ID0ge1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN5c3RlbVByb21wdCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OlxuICAgICAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgICAgICA/IHpvZFJlc3BvbnNlRm9ybWF0KFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24sICdyZWNvbW1lbmRhdGlvbnMnKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICBtb2RlbCxcbiAgICAgICAgc3RyZWFtOiB0cnVlLFxuICAgIH1cbiAgICBjb25zdCBzdHJlYW0gPSByZXF1aXJlc0xpdmVEYXRhXG4gICAgICAgID8gYXdhaXQgbWFrZVBlcnBsZXhpdHlDYWxsKG1lc3NhZ2VCb2R5KVxuICAgICAgICA6IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKG1lc3NhZ2VCb2R5IGFzIGFueSlcbiAgICBsZXQgbWVzc2FnZSA9IFtdXG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGxldCBidWZmZXI6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBmaXJzdEZld0xpbWl0ID0gMyAvLyBTZW5kIHRoZSBmaXJzdCAzIGNodW5rcyBpbW1lZGlhdGVseVxuICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDEwMCAvLyBUaGVuIGNvbWJpbmUgMTAgY2h1bmtzIGF0IGEgdGltZVxuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHVzZXJJZCArICcjJyArIERhdGUubm93KCkudG9TdHJpbmcoKVxuXG4gICAgaWYgKCFyZXF1aXJlc0xpdmVEYXRhKSB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3RyZWFtIGFzIGFueSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNodW5rLmNob2ljZXNbMF0/LmRlbHRhPy5jb250ZW50IHx8ICcnXG5cbiAgICAgICAgICAgIC8vIEZvciB0aGUgZmlyc3QgZmV3IGNodW5rcywgc2VuZCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNvdW50IDwgZmlyc3RGZXdMaW1pdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnR290OicsIGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29udGVudCwgZmFsc2UsIG1lc3NhZ2VJZClcbiAgICAgICAgICAgICAgICBjb3VudCA9IGNvdW50ICsgMVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBZnRlciB0aGUgZmlyc3QgZmV3LCBhY2N1bXVsYXRlIGNodW5rcyBpbiBhIGJ1ZmZlclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGNvbnRlbnQpXG5cbiAgICAgICAgICAgICAgICAvLyBPbmNlIHdlJ3ZlIGFjY3VtdWxhdGVkIGVub3VnaCBjaHVua3MgKGJhdGNoU2l6ZSksIHNlbmQgdGhlbSBhcyBvbmUgY29tYmluZWQgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGlmIChidWZmZXIubGVuZ3RoID09PSBiYXRjaFNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyBjb21iaW5lZCBtZXNzYWdlOicsIGNvbWJpbmVkTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29tYmluZWRNZXNzYWdlLCBmYWxzZSwgbWVzc2FnZUlkKVxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnB1c2goY29tYmluZWRNZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBidWZmZXIgYWZ0ZXIgc2VuZGluZ1xuICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBbXVxuICAgICAgICAgICAgICAgICAgICBjb3VudCA9IGNvdW50ICsgMVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEluY3JlbWVudCB0aGUgY291bnRlciBldmVuIHdoZW4gYnVmZmVyaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gW3N0cmVhbT8uY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQgfHwgJyddXG4gICAgfVxuICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nIGNodW5rcyBpbiB0aGUgYnVmZmVyIGFmdGVyIHRoZSBsb29wIGVuZHMsIHNlbmQgdGhlbVxuICAgIGlmIChidWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBjb21iaW5lZE1lc3NhZ2UgPSBidWZmZXIuam9pbignJylcbiAgICAgICAgY29uc29sZS5pbmZvKCdTZW5kaW5nIGZpbmFsIGNvbWJpbmVkIG1lc3NhZ2U6JywgY29tYmluZWRNZXNzYWdlKVxuICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb21iaW5lZE1lc3NhZ2UsIHRydWUsIG1lc3NhZ2VJZClcbiAgICAgICAgbWVzc2FnZS5wdXNoKGNvbWJpbmVkTWVzc2FnZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCAnJywgdHJ1ZSwgbWVzc2FnZUlkKVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZS5qb2luKCcnKVxufVxuXG5leHBvcnQgZW51bSBJbmZvcm1hdGlvbk9wdGlvbnMge1xuICAgICdJTlZFU1RNRU5UUycsXG4gICAgJ1RSQU5TQUNUSU9OUycsXG4gICAgJ0JBTktBQ0NPVU5UUycsXG59XG5leHBvcnQgaW50ZXJmYWNlIEdwdERhdGVSZXNwb25zZSB7XG4gICAgZGF5OiBudW1iZXJcbiAgICBtb250aDogbnVtYmVyXG4gICAgeWVhcjogbnVtYmVyXG59XG5leHBvcnQgaW50ZXJmYWNlIERhdGFSYW5nZVJlc3BvbnNlIHtcbiAgICBzdGFydERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgZW5kRGF5OiBHcHREYXRlUmVzcG9uc2VcbiAgICBoYXNOb1RpbWVDb25zdHJhaW50OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5mb3JtYXRpb25PcHRpb25zUmVzcG9uc2Uge1xuICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogSW5mb3JtYXRpb25PcHRpb25zW11cbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybWF0dGVkQ3VycmVudERhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpIC8vIEdldCB0aGUgY3VycmVudCBkYXRlIGFuZCB0aW1lXG5cbiAgICAvLyBFeHRyYWN0IHllYXIsIG1vbnRoLCBhbmQgZGF5XG4gICAgY29uc3QgeWVhciA9IG5vdy5nZXRGdWxsWWVhcigpXG4gICAgY29uc3QgbW9udGggPSBTdHJpbmcobm93LmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpIC8vIE1vbnRocyBhcmUgMC1iYXNlZCwgc28gYWRkIDFcbiAgICBjb25zdCBkYXkgPSBTdHJpbmcobm93LmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKVxuXG4gICAgLy8gUmV0dXJuIHRoZSBmb3JtYXR0ZWQgZGF0ZSBhcyAnWVlZWS1NTS1ERCdcbiAgICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9YFxufVxuXG5leHBvcnQgY29uc3QgZ2V0RGF0ZVJhbmdlRnJvbU1vZGVsID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSA9IHoub2JqZWN0KHtcbiAgICAgICAgc3RhcnREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGVuZERheTogei5vYmplY3Qoe1xuICAgICAgICAgICAgZGF5OiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgbW9udGg6IHoubnVtYmVyKCksXG4gICAgICAgICAgICB5ZWFyOiB6Lm51bWJlcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgaGFzTm9UaW1lQ29uc3RyYWludDogei5ib29sZWFuKCksXG4gICAgfSlcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnVGhlIGN1cnJlbnQgZGF0ZSBpcyAnICtcbiAgICAgICAgICAgICAgICAgICAgZ2V0Rm9ybWF0dGVkQ3VycmVudERhdGUoKSArXG4gICAgICAgICAgICAgICAgICAgICcgRmlsbCBvdXQgdGhlIGJlc3Qgc3VpdGVkIGRhdGUgcmFuZ2UgZm9yIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgK1xuICAgICAgICAgICAgICAgICAgICBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlVmFsdWVzRm9yRGF0ZVJhbmdlLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmV4cG9ydCBjb25zdCBnZXROZWVkZWRJbmZvcm1hdGlvbkZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIG5lZWRlZCBpbmZvcm1hdGlvbicpXG4gICAgY29uc3QgQWNjZXB0YWJsZUluZm9ybWF0aW9uT3B0aW9ucyA9IHoub2JqZWN0KHtcbiAgICAgICAgb3B0aW9uc0ZvckluZm9ybWF0aW9uOiB6LmFycmF5KHouZW51bShbJ0lOVkVTVE1FTlRTJywgJ1RSQU5TQUNUSU9OUycsICdCQU5LQUNDT1VOVFMnXSkpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1doYXQgaW5mb3JtYXRpb24gaXMgYmVzdCBzdWl0ZWQgdG8gYW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgKyBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmNvbnN0IGZsYXR0ZW4gPSAodmFsdWU6IGFueSk6IGFueVtdID0+IHtcbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGZsYXR0ZW4gZWFjaCBlbGVtZW50IHJlY3Vyc2l2ZWx5XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5mbGF0TWFwKGZsYXR0ZW4pIC8vIFVzZSBmbGF0TWFwIHRvIGZsYXR0ZW4gdGhlIGFycmF5IHJlY3Vyc2l2ZWx5XG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3QsIGZsYXR0ZW4gaXRzIHZhbHVlcyByZWN1cnNpdmVseVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXModmFsdWUpKVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LCByZXR1cm4gaXQgYXMgYSBzaW5nbGUtZWxlbWVudCBhcnJheVxuICAgIHJldHVybiBbdmFsdWVdXG59XG5cbmV4cG9ydCBjb25zdCBnZXRUZWNobmljYWxXb3Jkc1doZXJlV2VDYW5Hb0RlZXBlciA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgJ1dlIGFyZSBzdW1tYXJpemluZyBmaW5hbmNpYWwgaW5mb3JtYXRpb24gcmV0dXJuIHRoZSBleGFjdCBwaHJhc2VzIChpbmNsdWRlIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgcHVuY3R1YXRpb24pIHdoZXJlIHdlIGNvdWxkIGRvIGZpbmFuY2lhbCBhbmFseXNpcyBpbnRvIHRoZSB0b3BpYy4gIHJlc3BvbmQgaW4gdGhlIGpzb24gZm9ybWF0IFtwaHJhc2UxLCBwaHJhc2UyXV0nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfSxcbiAgICAgICAgICAgIG1vZGVsOiAnZ3B0LTMuNS10dXJibycsXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGpzb25PYmplY3QgPSBKU09OLnBhcnNlKGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIS5jb250ZW50IHx8ICcnKVxuICAgICAgICBpZiAoanNvbk9iamVjdC5waHJhc2UxIHx8IGpzb25PYmplY3QucGhyYXNlcyB8fCBPYmplY3Qua2V5cyhqc29uT2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKGpzb25PYmplY3QpKVxuICAgICAgICB9IGVsc2UgaWYgKGpzb25PYmplY3QubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihqc29uT2JqZWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBbXVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUFzc2lzdGFudCA9IGFzeW5jICgpID0+XG4gICAgYXBpQ2xpZW50LmJldGEuYXNzaXN0YW50cy5jcmVhdGUoe1xuICAgICAgICBpbnN0cnVjdGlvbnM6XG4gICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gd3JpdGUgYW5kIHJ1biBjb2RlIHRvIGFuc3dlciB0aGUgcXVlc3Rpb24uJyxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IHVwbG9hZEZpbGVUb0Fzc2lzdGFudCA9IGFzeW5jIChmaWxlOiBGaWxlKSA9PiB7XG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zdCBmaWxlUmV0dXJuID0gYXdhaXQgYXBpQ2xpZW50LmZpbGVzLmNyZWF0ZSh7XG4gICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgIHB1cnBvc2U6ICdhc3Npc3RhbnRzJyxcbiAgICB9KVxuICAgIHJldHVybiBmaWxlUmV0dXJuXG59XG5cbmV4cG9ydCBjb25zdCBjb2RlSW50ZXJwZXJ0ZXJGb3JBbmFseXNpcyA9IGFzeW5jIChmaWxlSWRzOiBzdHJpbmdbXSwgYXNzaXN0YW50X2lkOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGhyZWFkID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgYXR0YWNobWVudHM6IGZpbGVJZHMubWFwKChmaWxlSWQpID0+ICh7IGZpbGVfaWQ6IGZpbGVJZCwgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSB9KSksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pXG4gICAgcmV0dXJuIHRocmVhZFxufVxuXG5leHBvcnQgY29uc3QgcnVuVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcsIGFzc2lzdGFudF9pZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcnVuUGFyYW1zID0ge1xuICAgICAgICBhc3Npc3RhbnRfaWQ6IGFzc2lzdGFudF9pZCxcbiAgICAgICAgdG9vbF9jaG9pY2U6IHsgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH0gYXMgQXNzaXN0YW50VG9vbENob2ljZSxcbiAgICB9XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5ydW5zLmNyZWF0ZUFuZFBvbGwodGhyZWFkSWQsIHJ1blBhcmFtcylcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKHN0YXR1cylcbiAgICByZXR1cm4gc3RhdHVzXG59XG5cbmV4cG9ydCBjb25zdCBsaXN0TWVzc2FnZXNGb3JUaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5tZXNzYWdlcy5saXN0KHRocmVhZElkKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2cobWVzc2FnZXMpXG4gICAgcmV0dXJuIG1lc3NhZ2VzXG59XG5cbmV4cG9ydCBjb25zdCBzZW5kQ2hhdFRvVUkgPSBhc3luYyAoXG4gICAgcGs6IHN0cmluZyxcbiAgICBzazogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBpc0xhc3RDaHVuazogYm9vbGVhbixcbiAgICBtZXNzYWdlSWQ6IHN0cmluZ1xuKSA9PiB7XG4gICAgY29uc3QgY2hhdElucHV0OiBDaGF0SW5wdXQgPSB7XG4gICAgICAgIHBrOiBwayxcbiAgICAgICAgc2s6IHNrLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB0aW1lOiBEYXRlLm5vdygpLnRvU3RyaW5nKCksXG4gICAgICAgIGlzTGFzdENodW5rLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgfVxuXG4gICAgLy8gUHJlcGFyZSBHcmFwaFFMIHJlcXVlc3QgcGF5bG9hZFxuICAgIGNvbnN0IGdyYXBocWxEYXRhID0ge1xuICAgICAgICBxdWVyeTogY3JlYXRlQ2hhdCxcbiAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBjaGF0OiBjaGF0SW5wdXQsXG4gICAgICAgIH0sXG4gICAgfVxuICAgIGNvbnN0IHBvc3RCb2R5ID0gSlNPTi5zdHJpbmdpZnkoZ3JhcGhxbERhdGEpXG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjcmVkZW50aWFscyA9IGF3YWl0IGRlZmF1bHRQcm92aWRlcigpKClcbiAgICAgICAgY29uc3QgdXJpID0gbmV3IFVSTChhcHBzeW5jVXJsKVxuICAgICAgICBjb25zdCBodHRwUmVxdWVzdCA9IHtcbiAgICAgICAgICAgIGhvc3RuYW1lOiB1cmkuaG9zdG5hbWUsXG4gICAgICAgICAgICBwYXRoOiB1cmkucGF0aG5hbWUsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBob3N0OiB1cmkuaG9zdG5hbWUsXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBwb3N0Qm9keSxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBhIHNpZ25lciBvYmplY3RcbiAgICAgICAgY29uc3Qgc2lnbmVyID0gYXdzNC5zaWduKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlZ2lvbjogJ2NhLWNlbnRyYWwtMScsXG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2FwcHN5bmMnLCAvLyBBcHBTeW5jIGlzIHRoZSBzZXJ2aWNlIHdlJ3JlIGludGVyYWN0aW5nIHdpdGhcbiAgICAgICAgICAgICAgICBwYXRoOiBodHRwUmVxdWVzdC5wYXRoLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IGh0dHBSZXF1ZXN0LmhlYWRlcnMsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBodHRwUmVxdWVzdC5tZXRob2QsXG4gICAgICAgICAgICAgICAgYm9keTogaHR0cFJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYWNjZXNzS2V5SWQ6IGNyZWRlbnRpYWxzLmFjY2Vzc0tleUlkLFxuICAgICAgICAgICAgICAgIHNlY3JldEFjY2Vzc0tleTogY3JlZGVudGlhbHMuc2VjcmV0QWNjZXNzS2V5LFxuICAgICAgICAgICAgICAgIHNlc3Npb25Ub2tlbjogY3JlZGVudGlhbHMuc2Vzc2lvblRva2VuLFxuICAgICAgICAgICAgfVxuICAgICAgICApXG5cbiAgICAgICAgLy8gU2lnbiB0aGUgcmVxdWVzdFxuICAgICAgICBPYmplY3QuYXNzaWduKGh0dHBSZXF1ZXN0LmhlYWRlcnMsIHNpZ25lci5oZWFkZXJzKVxuXG4gICAgICAgIC8vIE1ha2UgdGhlIEhUVFAgcmVxdWVzdFxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVyaS5ocmVmLCBodHRwUmVxdWVzdClcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBKU09OIFJlc3BvbnNlID0gJHtKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKX1gKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZFVENIIEVSUk9SOiAke0pTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKX1gKVxuICAgIH1cbn1cbiJdfQ==