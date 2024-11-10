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
                : chatType === API_1.ChatType.GeneralRecommendation
                    ? 'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. Leave the transfer information empty if no transfer is needed'
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
            : chatType === API_1.ChatType.GeneralRecommendation
                ? (0, zod_2.zodResponseFormat)(Recommendations, 'recommendations')
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
    InformationOptions[InformationOptions["ACCOUNTS"] = 2] = "ACCOUNTS";
    InformationOptions[InformationOptions["MONTHLYSUMMARIES"] = 3] = "MONTHLYSUMMARIES";
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
        optionsForInformation: zod_1.z.array(zod_1.z.enum(['INVESTMENTS', 'TRANSACTIONS', 'ACCOUNTS'])),
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
    // TODO: expire the chats
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUV0RCwrQkFBb0Y7QUFDcEYsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFDNUIsaURBQTREO0FBQzVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsR0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLGtDQUE0QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxRyxNQUFNLFdBQVcsR0FBRyxVQUFtQyxDQUFBO0FBRXZELE1BQU0sK0JBQStCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxXQUFXLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN2QixNQUFNLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FDWCxPQUFDLENBQUMsTUFBTSxDQUFDO1FB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UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25FLENBQUM7QUFDTCxDQUFDLENBQUE7QUFwRVksUUFBQSxZQUFZLGdCQW9FeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSdcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnXG5pbXBvcnQgeyB6b2RSZXNwb25zZUZvcm1hdCB9IGZyb20gJ29wZW5haS9oZWxwZXJzL3pvZCdcbmltcG9ydCB7IEFzc2lzdGFudFRvb2xDaG9pY2UgfSBmcm9tICdvcGVuYWkvcmVzb3VyY2VzL2JldGEvdGhyZWFkcy90aHJlYWRzJ1xuaW1wb3J0IHsgQ2hhdEZvY3VzLCBDaGF0SW5wdXQsIENoYXRUeXBlLCBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5IH0gZnJvbSAnLi9BUEknXG5pbXBvcnQgeyBjcmVhdGVDaGF0IH0gZnJvbSAnLi9ncmFwaHFsL211dGF0aW9ucydcbmltcG9ydCB7IGRlZmF1bHRQcm92aWRlciB9IGZyb20gJ0Bhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXItbm9kZSdcbmltcG9ydCAqIGFzIGF3czQgZnJvbSAnYXdzNCdcbmltcG9ydCB7IG5ld3NQcm9tcHQsIHRlY2huaWNhbFByb21wdCB9IGZyb20gJy4vc3RvY2tQcm9tcHRzJ1xuY29uc3QgYXBwc3luY1VybCA9IHByb2Nlc3MuZW52LkFQUFNZTkNfVVJMIGFzIHN0cmluZ1xuY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19BUElfS0VZIGFzIHN0cmluZ1xuXG5jb25zdCByZWNvbW1lbmRhdGlvbkFjdGlvbiA9IHoub2JqZWN0KHtcbiAgICBkZXNjcmlwdGlvbjogei5zdHJpbmcoKSxcbiAgICB0cmFuc2ZlcnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGFtb3VudDogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGZyb21BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHRvQWNjb3VudE5hbWU6IHouc3RyaW5nKCksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbi8qKlxuICogaGlnaExldmVsQ2F0ZWdvcnk6IEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnlcbiAgICB0aW1lZnJhbWU6IEJ1ZGdldFRpbWVmcmFtZVxuICAgIHNwZW5kaW5nVGhyZXNob2xkOiBGbG9hdFxuICAgIGNyZWF0ZWRBdDogU3RyaW5nXG4gICAgc3BlY2lmaWNQYXllZVJlZ2V4OiBTdHJpbmdcbiAqL1xuY29uc3QgY2F0ZWdvcmllczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyhIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5KS5maWx0ZXIoKGtleSkgPT4gaXNOYU4oTnVtYmVyKGtleSkpKVxuY29uc3QgdHVwbGVWYWx1ZXMgPSBjYXRlZ29yaWVzIGFzIFtzdHJpbmcsIC4uLnN0cmluZ1tdXVxuXG5jb25zdCB0cmFuc2FjdGlvblJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIGJ1ZGdldDogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgdGltZWZyYW1lOiB6LmVudW0oWydEQUlMWScsICdXRUVLTFknLCAnTU9OVEhMWSddKSxcbiAgICAgICAgICAgIHNwZW5kaW5nVGhyZXNob2xkOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgaGlnaExldmVsQ2F0ZWdvcnk6IHouZW51bSh0dXBsZVZhbHVlcyksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFJlY29tbWVuZGF0aW9ucyA9IHoub2JqZWN0KHtcbiAgICByZWNvbW1lbmRhdGlvbnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgYWN0aW9uOiByZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgVHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbiA9IHoub2JqZWN0KHtcbiAgICByZWNvbW1lbmRhdGlvbnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgYWN0aW9uOiB0cmFuc2FjdGlvblJlY29tbWVuZGF0aW9uQWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBwcmlvcml0eTogei5lbnVtKFsnSGlnaCcsICdNZWRpdW0nLCAnTG93J10pLFxuICAgICAgICB9KVxuICAgICksXG59KVxuXG4vKipcbiAqIFxuICogdHlwZSBHcmFwaFR5cGUge1xuICAgIHBpZUNoYXJ0OiBTdHJpbmdcbiAgICBiYXJDaGFydDogU3RyaW5nXG4gICAgaGlzdG9ncmFtOiBTdHJpbmdcbiAgICB0aW1lUGxvdDogU3RyaW5nXG59XG4gKiB0eXBlIFByZW1pdW1DaGF0UmVzcG9uc2Uge1xuICAgIHJlc3BvbnNlOiBTdHJpbmdcbiAgICBncmFwaHM6IEdyYXBoVHlwZVxuICovXG5cbmNvbnN0IFByZW1pdW1DaGF0UmVzcG9uc2UgPSB6Lm9iamVjdCh7XG4gICAgcmVzcG9uc2U6IHouc3RyaW5nKCksXG59KVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZmVyIHtcbiAgICBmcm9tQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIHRvQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIGFtb3VudDogc3RyaW5nXG59XG5pbnRlcmZhY2UgUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgIHRyYW5zZmVyczogVHJhbnNmZXJbXVxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWNvbW1lbmRhdGlvbiB7XG4gICAgZXhwbGFuYXRpb246IHN0cmluZ1xuICAgIGFjdGlvbjogUmVjb21tZW5kYXRpb25BY3Rpb25cbiAgICB0aXRsZTogc3RyaW5nXG4gICAgcHJpb3JpdHk6IG51bWJlclxufVxuXG5leHBvcnQgY29uc3QgYXBpQ2xpZW50ID0gbmV3IE9wZW5BSSh7XG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudlsnR3B0U2VjcmV0S2V5J10hLFxuICAgIGRhbmdlcm91c2x5QWxsb3dCcm93c2VyOiBmYWxzZSxcbn0pXG5cbmNvbnN0IGNoYXQgPSBhcGlDbGllbnQuY2hhdFxuXG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zRnJvbURhdGEgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8nLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KFJlY29tbWVuZGF0aW9ucywgJ3JlY29tbWVuZGF0aW9ucycpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5jb25zdCBtYWtlUGVycGxleGl0eUNhbGwgPSBhc3luYyAoYm9keTogYW55KSA9PiB7XG4gICAgZGVsZXRlIGJvZHlbJ3Jlc3BvbnNlX2Zvcm1hdCddXG4gICAgZGVsZXRlIGJvZHlbJ3N0cmVhbSddXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucGVycGxleGl0eS5haS9jaGF0L2NvbXBsZXRpb25zJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IHByb2Nlc3MuZW52LlBlcnBsZXhpdHlTZWNyZXRLZXksXG4gICAgICAgIH0gYXMgYW55LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICB9KVxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgLy8gTG9nIHRoZSBlcnJvciByZXNwb25zZSBmb3IgZGVidWdnaW5nXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBSZXNwb25zZTonLCBlcnJvclRleHQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIHJlcXVlc3QgZmFpbGVkIHdpdGggc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHR9YClcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBKU09OLiBSZXNwb25zZSB3YXM6JywgcmVzcG9uc2VUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FQSSByZXR1cm5lZCBub24tSlNPTiByZXNwb25zZScpXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGxldGVDaGF0RnJvbVByb21wdCA9IGFzeW5jIChcbiAgICBwcm9tcHQ6IHN0cmluZyxcbiAgICB0eXBlOiBDaGF0Rm9jdXMgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHJlcXVpcmVzTGl2ZURhdGE6IGJvb2xlYW4sXG4gICAgY2hhdFR5cGU6IENoYXRUeXBlXG4pID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VuZGluZycsIHByb21wdCwgJyB0byBncHQnKVxuICAgIGNvbnN0IHN5c3RlbVByb21wdCA9XG4gICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnlcbiAgICAgICAgICAgID8gbmV3c1Byb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyB0ZWNobmljYWxQcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgID8gYFlvdSBhcmUgYSBwZXJzb25hbCBzcGVuZGluZyBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBZb3UgcHJvdmlkZSBzcGVuZGluZyByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwuYFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuR2VuZXJhbFJlY29tbWVuZGF0aW9uXG4gICAgICAgICAgICA/ICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJ1xuICAgICAgICAgICAgOiBgWW91IGFyZSBhIHBlcnNvbmFsICR7XG4gICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgIH0gYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gYFxuICAgIGNvbnN0IG1vZGVsID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeSB8fCBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyAnbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lJ1xuICAgICAgICAgICAgOiAnZ3B0LTRvJ1xuICAgIGNvbnN0IG1lc3NhZ2VCb2R5ID0ge1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN5c3RlbVByb21wdCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OlxuICAgICAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgICAgICA/IHpvZFJlc3BvbnNlRm9ybWF0KFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24sICdyZWNvbW1lbmRhdGlvbnMnKVxuICAgICAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvblxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoUmVjb21tZW5kYXRpb25zLCAncmVjb21tZW5kYXRpb25zJylcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgbW9kZWwsXG4gICAgICAgIHN0cmVhbTogdHJ1ZSxcbiAgICB9XG4gICAgY29uc3Qgc3RyZWFtID0gcmVxdWlyZXNMaXZlRGF0YVxuICAgICAgICA/IGF3YWl0IG1ha2VQZXJwbGV4aXR5Q2FsbChtZXNzYWdlQm9keSlcbiAgICAgICAgOiBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZShtZXNzYWdlQm9keSBhcyBhbnkpXG4gICAgbGV0IG1lc3NhZ2UgPSBbXVxuICAgIGxldCBjb3VudCA9IDBcbiAgICBsZXQgYnVmZmVyOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgZmlyc3RGZXdMaW1pdCA9IDMgLy8gU2VuZCB0aGUgZmlyc3QgMyBjaHVua3MgaW1tZWRpYXRlbHlcbiAgICBjb25zdCBiYXRjaFNpemUgPSAxMDAgLy8gVGhlbiBjb21iaW5lIDEwIGNodW5rcyBhdCBhIHRpbWVcbiAgICBjb25zdCBtZXNzYWdlSWQgPSB1c2VySWQgKyAnIycgKyBEYXRlLm5vdygpLnRvU3RyaW5nKClcblxuICAgIGlmICghcmVxdWlyZXNMaXZlRGF0YSkge1xuICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHN0cmVhbSBhcyBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBjaHVuay5jaG9pY2VzWzBdPy5kZWx0YT8uY29udGVudCB8fCAnJ1xuXG4gICAgICAgICAgICAvLyBGb3IgdGhlIGZpcnN0IGZldyBjaHVua3MsIHNlbmQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjb3VudCA8IGZpcnN0RmV3TGltaXQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0dvdDonLCBjb250ZW50KVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UucHVzaChjb250ZW50KVxuICAgICAgICAgICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbnRlbnQsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgY291bnQgPSBjb3VudCArIDFcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIGZpcnN0IGZldywgYWNjdW11bGF0ZSBjaHVua3MgaW4gYSBidWZmZXJcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaChjb250ZW50KVxuXG4gICAgICAgICAgICAgICAgLy8gT25jZSB3ZSd2ZSBhY2N1bXVsYXRlZCBlbm91Z2ggY2h1bmtzIChiYXRjaFNpemUpLCBzZW5kIHRoZW0gYXMgb25lIGNvbWJpbmVkIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gYmF0Y2hTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVkTWVzc2FnZSA9IGJ1ZmZlci5qb2luKCcnKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1NlbmRpbmcgY29tYmluZWQgbWVzc2FnZTonLCBjb21iaW5lZE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbWJpbmVkTWVzc2FnZSwgZmFsc2UsIG1lc3NhZ2VJZClcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbWJpbmVkTWVzc2FnZSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgYnVmZmVyIGFmdGVyIHNlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gW11cbiAgICAgICAgICAgICAgICAgICAgY291bnQgPSBjb3VudCArIDFcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbmNyZW1lbnQgdGhlIGNvdW50ZXIgZXZlbiB3aGVuIGJ1ZmZlcmluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IFtzdHJlYW0/LmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50IHx8ICcnXVxuICAgIH1cbiAgICAvLyBJZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBjaHVua3MgaW4gdGhlIGJ1ZmZlciBhZnRlciB0aGUgbG9vcCBlbmRzLCBzZW5kIHRoZW1cbiAgICBpZiAoYnVmZmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyBmaW5hbCBjb21iaW5lZCBtZXNzYWdlOicsIGNvbWJpbmVkTWVzc2FnZSlcbiAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29tYmluZWRNZXNzYWdlLCB0cnVlLCBtZXNzYWdlSWQpXG4gICAgICAgIG1lc3NhZ2UucHVzaChjb21iaW5lZE1lc3NhZ2UpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgJycsIHRydWUsIG1lc3NhZ2VJZClcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2Uuam9pbignJylcbn1cblxuZXhwb3J0IGVudW0gSW5mb3JtYXRpb25PcHRpb25zIHtcbiAgICAnSU5WRVNUTUVOVFMnLFxuICAgICdUUkFOU0FDVElPTlMnLFxuICAgICdBQ0NPVU5UUycsXG4gICAgJ01PTlRITFlTVU1NQVJJRVMnLFxufVxuZXhwb3J0IGludGVyZmFjZSBHcHREYXRlUmVzcG9uc2Uge1xuICAgIGRheTogbnVtYmVyXG4gICAgbW9udGg6IG51bWJlclxuICAgIHllYXI6IG51bWJlclxufVxuZXhwb3J0IGludGVyZmFjZSBEYXRhUmFuZ2VSZXNwb25zZSB7XG4gICAgc3RhcnREYXk6IEdwdERhdGVSZXNwb25zZVxuICAgIGVuZERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgaGFzTm9UaW1lQ29uc3RyYWludDogYm9vbGVhblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZm9ybWF0aW9uT3B0aW9uc1Jlc3BvbnNlIHtcbiAgICBvcHRpb25zRm9ySW5mb3JtYXRpb246IEluZm9ybWF0aW9uT3B0aW9uc1tdXG59XG5cbmZ1bmN0aW9uIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKSAvLyBHZXQgdGhlIGN1cnJlbnQgZGF0ZSBhbmQgdGltZVxuXG4gICAgLy8gRXh0cmFjdCB5ZWFyLCBtb250aCwgYW5kIGRheVxuICAgIGNvbnN0IHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKVxuICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKG5vdy5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKSAvLyBNb250aHMgYXJlIDAtYmFzZWQsIHNvIGFkZCAxXG4gICAgY29uc3QgZGF5ID0gU3RyaW5nKG5vdy5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJylcblxuICAgIC8vIFJldHVybiB0aGUgZm9ybWF0dGVkIGRhdGUgYXMgJ1lZWVktTU0tREQnXG4gICAgcmV0dXJuIGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fWBcbn1cblxuZXhwb3J0IGNvbnN0IGdldERhdGVSYW5nZUZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IEFjY2VwdGFibGVWYWx1ZXNGb3JEYXRlUmFuZ2UgPSB6Lm9iamVjdCh7XG4gICAgICAgIHN0YXJ0RGF5OiB6Lm9iamVjdCh7XG4gICAgICAgICAgICBkYXk6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBtb250aDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIHllYXI6IHoubnVtYmVyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBlbmREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGhhc05vVGltZUNvbnN0cmFpbnQ6IHouYm9vbGVhbigpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgJ1RoZSBjdXJyZW50IGRhdGUgaXMgJyArXG4gICAgICAgICAgICAgICAgICAgIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCkgK1xuICAgICAgICAgICAgICAgICAgICAnIEZpbGwgb3V0IHRoZSBiZXN0IHN1aXRlZCBkYXRlIHJhbmdlIGZvciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiAnICtcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LnN1YnN0cmluZygwLCAxMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSwgJ2RhdGVSYW5nZScpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5leHBvcnQgY29uc3QgZ2V0TmVlZGVkSW5mb3JtYXRpb25Gcm9tTW9kZWwgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZyBuZWVkZWQgaW5mb3JtYXRpb24nKVxuICAgIGNvbnN0IEFjY2VwdGFibGVJbmZvcm1hdGlvbk9wdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogei5hcnJheSh6LmVudW0oWydJTlZFU1RNRU5UUycsICdUUkFOU0FDVElPTlMnLCAnQUNDT1VOVFMnXSkpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1doYXQgaW5mb3JtYXRpb24gaXMgYmVzdCBzdWl0ZWQgdG8gYW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgKyBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmNvbnN0IGZsYXR0ZW4gPSAodmFsdWU6IGFueSk6IGFueVtdID0+IHtcbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGZsYXR0ZW4gZWFjaCBlbGVtZW50IHJlY3Vyc2l2ZWx5XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5mbGF0TWFwKGZsYXR0ZW4pIC8vIFVzZSBmbGF0TWFwIHRvIGZsYXR0ZW4gdGhlIGFycmF5IHJlY3Vyc2l2ZWx5XG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3QsIGZsYXR0ZW4gaXRzIHZhbHVlcyByZWN1cnNpdmVseVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXModmFsdWUpKVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LCByZXR1cm4gaXQgYXMgYSBzaW5nbGUtZWxlbWVudCBhcnJheVxuICAgIHJldHVybiBbdmFsdWVdXG59XG5cbmV4cG9ydCBjb25zdCBnZXRUZWNobmljYWxXb3Jkc1doZXJlV2VDYW5Hb0RlZXBlciA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgJ1dlIGFyZSBzdW1tYXJpemluZyBmaW5hbmNpYWwgaW5mb3JtYXRpb24gcmV0dXJuIHRoZSBleGFjdCBwaHJhc2VzIChpbmNsdWRlIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgcHVuY3R1YXRpb24pIHdoZXJlIHdlIGNvdWxkIGRvIGZpbmFuY2lhbCBhbmFseXNpcyBpbnRvIHRoZSB0b3BpYy4gIHJlc3BvbmQgaW4gdGhlIGpzb24gZm9ybWF0IFtwaHJhc2UxLCBwaHJhc2UyXV0nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfSxcbiAgICAgICAgICAgIG1vZGVsOiAnZ3B0LTMuNS10dXJibycsXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGpzb25PYmplY3QgPSBKU09OLnBhcnNlKGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIS5jb250ZW50IHx8ICcnKVxuICAgICAgICBpZiAoanNvbk9iamVjdC5waHJhc2UxIHx8IGpzb25PYmplY3QucGhyYXNlcyB8fCBPYmplY3Qua2V5cyhqc29uT2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKGpzb25PYmplY3QpKVxuICAgICAgICB9IGVsc2UgaWYgKGpzb25PYmplY3QubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihqc29uT2JqZWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBbXVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUFzc2lzdGFudCA9IGFzeW5jICgpID0+XG4gICAgYXBpQ2xpZW50LmJldGEuYXNzaXN0YW50cy5jcmVhdGUoe1xuICAgICAgICBpbnN0cnVjdGlvbnM6XG4gICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gd3JpdGUgYW5kIHJ1biBjb2RlIHRvIGFuc3dlciB0aGUgcXVlc3Rpb24uJyxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IHVwbG9hZEZpbGVUb0Fzc2lzdGFudCA9IGFzeW5jIChmaWxlOiBGaWxlKSA9PiB7XG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zdCBmaWxlUmV0dXJuID0gYXdhaXQgYXBpQ2xpZW50LmZpbGVzLmNyZWF0ZSh7XG4gICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgIHB1cnBvc2U6ICdhc3Npc3RhbnRzJyxcbiAgICB9KVxuICAgIHJldHVybiBmaWxlUmV0dXJuXG59XG5cbmV4cG9ydCBjb25zdCBjb2RlSW50ZXJwZXJ0ZXJGb3JBbmFseXNpcyA9IGFzeW5jIChmaWxlSWRzOiBzdHJpbmdbXSwgYXNzaXN0YW50X2lkOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGhyZWFkID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgYXR0YWNobWVudHM6IGZpbGVJZHMubWFwKChmaWxlSWQpID0+ICh7IGZpbGVfaWQ6IGZpbGVJZCwgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSB9KSksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pXG4gICAgcmV0dXJuIHRocmVhZFxufVxuXG5leHBvcnQgY29uc3QgcnVuVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcsIGFzc2lzdGFudF9pZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcnVuUGFyYW1zID0ge1xuICAgICAgICBhc3Npc3RhbnRfaWQ6IGFzc2lzdGFudF9pZCxcbiAgICAgICAgdG9vbF9jaG9pY2U6IHsgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH0gYXMgQXNzaXN0YW50VG9vbENob2ljZSxcbiAgICB9XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5ydW5zLmNyZWF0ZUFuZFBvbGwodGhyZWFkSWQsIHJ1blBhcmFtcylcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKHN0YXR1cylcbiAgICByZXR1cm4gc3RhdHVzXG59XG5cbmV4cG9ydCBjb25zdCBsaXN0TWVzc2FnZXNGb3JUaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5tZXNzYWdlcy5saXN0KHRocmVhZElkKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2cobWVzc2FnZXMpXG4gICAgcmV0dXJuIG1lc3NhZ2VzXG59XG5cbmV4cG9ydCBjb25zdCBzZW5kQ2hhdFRvVUkgPSBhc3luYyAoXG4gICAgcGs6IHN0cmluZyxcbiAgICBzazogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBpc0xhc3RDaHVuazogYm9vbGVhbixcbiAgICBtZXNzYWdlSWQ6IHN0cmluZ1xuKSA9PiB7XG4gICAgLy8gVE9ETzogZXhwaXJlIHRoZSBjaGF0c1xuICAgIGNvbnN0IGNoYXRJbnB1dDogQ2hhdElucHV0ID0ge1xuICAgICAgICBwazogcGssXG4gICAgICAgIHNrOiBzayxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgdGltZTogRGF0ZS5ub3coKS50b1N0cmluZygpLFxuICAgICAgICBpc0xhc3RDaHVuayxcbiAgICAgICAgbWVzc2FnZUlkLFxuICAgIH1cblxuICAgIC8vIFByZXBhcmUgR3JhcGhRTCByZXF1ZXN0IHBheWxvYWRcbiAgICBjb25zdCBncmFwaHFsRGF0YSA9IHtcbiAgICAgICAgcXVlcnk6IGNyZWF0ZUNoYXQsXG4gICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgY2hhdDogY2hhdElucHV0LFxuICAgICAgICB9LFxuICAgIH1cbiAgICBjb25zdCBwb3N0Qm9keSA9IEpTT04uc3RyaW5naWZ5KGdyYXBocWxEYXRhKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3JlZGVudGlhbHMgPSBhd2FpdCBkZWZhdWx0UHJvdmlkZXIoKSgpXG4gICAgICAgIGNvbnN0IHVyaSA9IG5ldyBVUkwoYXBwc3luY1VybClcbiAgICAgICAgY29uc3QgaHR0cFJlcXVlc3QgPSB7XG4gICAgICAgICAgICBob3N0bmFtZTogdXJpLmhvc3RuYW1lLFxuICAgICAgICAgICAgcGF0aDogdXJpLnBhdGhuYW1lLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgaG9zdDogdXJpLmhvc3RuYW1lLFxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogcG9zdEJvZHksXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgYSBzaWduZXIgb2JqZWN0XG4gICAgICAgIGNvbnN0IHNpZ25lciA9IGF3czQuc2lnbihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZWdpb246ICdjYS1jZW50cmFsLTEnLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdhcHBzeW5jJywgLy8gQXBwU3luYyBpcyB0aGUgc2VydmljZSB3ZSdyZSBpbnRlcmFjdGluZyB3aXRoXG4gICAgICAgICAgICAgICAgcGF0aDogaHR0cFJlcXVlc3QucGF0aCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiBodHRwUmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogaHR0cFJlcXVlc3QubWV0aG9kLFxuICAgICAgICAgICAgICAgIGJvZHk6IGh0dHBSZXF1ZXN0LmJvZHksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFjY2Vzc0tleUlkOiBjcmVkZW50aWFscy5hY2Nlc3NLZXlJZCxcbiAgICAgICAgICAgICAgICBzZWNyZXRBY2Nlc3NLZXk6IGNyZWRlbnRpYWxzLnNlY3JldEFjY2Vzc0tleSxcbiAgICAgICAgICAgICAgICBzZXNzaW9uVG9rZW46IGNyZWRlbnRpYWxzLnNlc3Npb25Ub2tlbixcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuXG4gICAgICAgIC8vIFNpZ24gdGhlIHJlcXVlc3RcbiAgICAgICAgT2JqZWN0LmFzc2lnbihodHRwUmVxdWVzdC5oZWFkZXJzLCBzaWduZXIuaGVhZGVycylcblxuICAgICAgICAvLyBNYWtlIHRoZSBIVFRQIHJlcXVlc3RcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmkuaHJlZiwgaHR0cFJlcXVlc3QpXG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKClcblxuICAgICAgICBjb25zb2xlLmxvZyhgSlNPTiBSZXNwb25zZSA9ICR7SlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMil9YClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBGRVRDSCBFUlJPUjogJHtKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMil9YClcbiAgICB9XG59XG4iXX0=