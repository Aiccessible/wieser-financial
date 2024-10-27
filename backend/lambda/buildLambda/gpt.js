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
const Recommendations = zod_1.z.object({
    recommendations: zod_1.z.array(zod_1.z.object({
        explanation: zod_1.z.string(),
        action: recommendationAction,
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
    graphs: zod_1.z.object({
        pieChart: zod_1.z.string(),
        barChart: zod_1.z.string(),
        histogram: zod_1.z.string(),
        timePlot: zod_1.z.string(),
    }),
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
            : `You are a personal ${type && type !== API_1.ChatFocus.All ? type : 'Finance'} assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. You plot data to beautiful svgs when it is helpful.`;
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
        response_format: (0, zod_2.zodResponseFormat)(PremiumChatResponse, 'financialchatresponse'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQTRCO0FBQzVCLDRDQUFzRDtBQUd0RCwrQkFBc0Q7QUFDdEQsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFFNUIsaURBQTREO0FBQzVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRixNQUFNLGVBQWUsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQzdCLGVBQWUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNwQixPQUFDLENBQUMsTUFBTSxDQUFDO1FBQ0wsV0FBVyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUU7UUFDdkIsTUFBTSxFQUFFLG9CQUFvQjtRQUM1QixLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNqQixRQUFRLEVBQUUsT0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUMsQ0FBQyxDQUNMO0NBQ0osQ0FBQyxDQUFBO0FBRUY7Ozs7Ozs7Ozs7O0dBV0c7QUFF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S0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbkUsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQW5FWSxRQUFBLFlBQVksZ0JBbUV4QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSAnb3BlbmFpJ1xuaW1wb3J0IHsgYW55LCB6IH0gZnJvbSAnem9kJ1xuaW1wb3J0IHsgem9kUmVzcG9uc2VGb3JtYXQgfSBmcm9tICdvcGVuYWkvaGVscGVycy96b2QnXG5pbXBvcnQgeyBBc3Npc3RhbnRUb29sQ2hvaWNlIH0gZnJvbSAnb3BlbmFpL3Jlc291cmNlcy9iZXRhL3RocmVhZHMvdGhyZWFkcydcbmltcG9ydCB7IHN0YXQgfSBmcm9tICdmcydcbmltcG9ydCB7IENoYXRGb2N1cywgQ2hhdElucHV0LCBDaGF0VHlwZSB9IGZyb20gJy4vQVBJJ1xuaW1wb3J0IHsgY3JlYXRlQ2hhdCB9IGZyb20gJy4vZ3JhcGhxbC9tdXRhdGlvbnMnXG5pbXBvcnQgeyBkZWZhdWx0UHJvdmlkZXIgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLW5vZGUnXG5pbXBvcnQgKiBhcyBhd3M0IGZyb20gJ2F3czQnXG5pbXBvcnQgeyBTaWduYXR1cmVWNCB9IGZyb20gJ0Bhd3Mtc2RrL3NpZ25hdHVyZS12NCdcbmltcG9ydCB7IG5ld3NQcm9tcHQsIHRlY2huaWNhbFByb21wdCB9IGZyb20gJy4vc3RvY2tQcm9tcHRzJ1xuY29uc3QgYXBwc3luY1VybCA9IHByb2Nlc3MuZW52LkFQUFNZTkNfVVJMIGFzIHN0cmluZ1xuY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19BUElfS0VZIGFzIHN0cmluZ1xuXG5jb25zdCByZWNvbW1lbmRhdGlvbkFjdGlvbiA9IHoub2JqZWN0KHtcbiAgICBkZXNjcmlwdGlvbjogei5zdHJpbmcoKSxcbiAgICB0cmFuc2ZlcnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGFtb3VudDogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGZyb21BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHRvQWNjb3VudE5hbWU6IHouc3RyaW5nKCksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFJlY29tbWVuZGF0aW9ucyA9IHoub2JqZWN0KHtcbiAgICByZWNvbW1lbmRhdGlvbnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgYWN0aW9uOiByZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBcbiAqIHR5cGUgR3JhcGhUeXBlIHtcbiAgICBwaWVDaGFydDogU3RyaW5nXG4gICAgYmFyQ2hhcnQ6IFN0cmluZ1xuICAgIGhpc3RvZ3JhbTogU3RyaW5nXG4gICAgdGltZVBsb3Q6IFN0cmluZ1xufVxuICogdHlwZSBQcmVtaXVtQ2hhdFJlc3BvbnNlIHtcbiAgICByZXNwb25zZTogU3RyaW5nXG4gICAgZ3JhcGhzOiBHcmFwaFR5cGVcbiAqL1xuXG5jb25zdCBQcmVtaXVtQ2hhdFJlc3BvbnNlID0gei5vYmplY3Qoe1xuICAgIHJlc3BvbnNlOiB6LnN0cmluZygpLFxuICAgIGdyYXBoczogei5vYmplY3Qoe1xuICAgICAgICBwaWVDaGFydDogei5zdHJpbmcoKSxcbiAgICAgICAgYmFyQ2hhcnQ6IHouc3RyaW5nKCksXG4gICAgICAgIGhpc3RvZ3JhbTogei5zdHJpbmcoKSxcbiAgICAgICAgdGltZVBsb3Q6IHouc3RyaW5nKCksXG4gICAgfSksXG59KVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZmVyIHtcbiAgICBmcm9tQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIHRvQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIGFtb3VudDogc3RyaW5nXG59XG5pbnRlcmZhY2UgUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgIHRyYW5zZmVyczogVHJhbnNmZXJbXVxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWNvbW1lbmRhdGlvbiB7XG4gICAgZXhwbGFuYXRpb246IHN0cmluZ1xuICAgIGFjdGlvbjogUmVjb21tZW5kYXRpb25BY3Rpb25cbiAgICB0aXRsZTogc3RyaW5nXG4gICAgcHJpb3JpdHk6IG51bWJlclxufVxuXG5leHBvcnQgY29uc3QgYXBpQ2xpZW50ID0gbmV3IE9wZW5BSSh7XG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudlsnR3B0U2VjcmV0S2V5J10hLFxuICAgIGRhbmdlcm91c2x5QWxsb3dCcm93c2VyOiBmYWxzZSxcbn0pXG5cbmNvbnN0IGNoYXQgPSBhcGlDbGllbnQuY2hhdFxuXG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zRnJvbURhdGEgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8nLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KFJlY29tbWVuZGF0aW9ucywgJ3JlY29tbWVuZGF0aW9ucycpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5jb25zdCBtYWtlUGVycGxleGl0eUNhbGwgPSBhc3luYyAoYm9keTogYW55KSA9PiB7XG4gICAgZGVsZXRlIGJvZHlbJ3Jlc3BvbnNlX2Zvcm1hdCddXG4gICAgZGVsZXRlIGJvZHlbJ3N0cmVhbSddXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucGVycGxleGl0eS5haS9jaGF0L2NvbXBsZXRpb25zJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IHByb2Nlc3MuZW52LlBlcnBsZXhpdHlTZWNyZXRLZXksXG4gICAgICAgIH0gYXMgYW55LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICB9KVxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgLy8gTG9nIHRoZSBlcnJvciByZXNwb25zZSBmb3IgZGVidWdnaW5nXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBSZXNwb25zZTonLCBlcnJvclRleHQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIHJlcXVlc3QgZmFpbGVkIHdpdGggc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHR9YClcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBKU09OLiBSZXNwb25zZSB3YXM6JywgcmVzcG9uc2VUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FQSSByZXR1cm5lZCBub24tSlNPTiByZXNwb25zZScpXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGxldGVDaGF0RnJvbVByb21wdCA9IGFzeW5jIChcbiAgICBwcm9tcHQ6IHN0cmluZyxcbiAgICB0eXBlOiBDaGF0Rm9jdXMgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHJlcXVpcmVzTGl2ZURhdGE6IGJvb2xlYW4sXG4gICAgY2hhdFR5cGU6IENoYXRUeXBlXG4pID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VuZGluZycsIHByb21wdCwgJyB0byBncHQnKVxuICAgIGNvbnN0IHN5c3RlbVByb21wdCA9XG4gICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnlcbiAgICAgICAgICAgID8gbmV3c1Byb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyB0ZWNobmljYWxQcm9tcHRcbiAgICAgICAgICAgIDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgdHlwZSAmJiB0eXBlICE9PSBDaGF0Rm9jdXMuQWxsID8gdHlwZSA6ICdGaW5hbmNlJ1xuICAgICAgICAgICAgICB9IGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIFlvdSBwbG90IGRhdGEgdG8gYmVhdXRpZnVsIHN2Z3Mgd2hlbiBpdCBpcyBoZWxwZnVsLmBcbiAgICBjb25zdCBtb2RlbCA9XG4gICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnkgfHwgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnlcbiAgICAgICAgICAgID8gJ2xsYW1hLTMuMS1zb25hci1sYXJnZS0xMjhrLW9ubGluZSdcbiAgICAgICAgICAgIDogJ2dwdC00bydcbiAgICBjb25zdCBtZXNzYWdlQm9keSA9IHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoUHJlbWl1bUNoYXRSZXNwb25zZSwgJ2ZpbmFuY2lhbGNoYXRyZXNwb25zZScpLFxuICAgICAgICBtb2RlbCxcbiAgICAgICAgc3RyZWFtOiB0cnVlLFxuICAgIH1cbiAgICBjb25zdCBzdHJlYW0gPSByZXF1aXJlc0xpdmVEYXRhXG4gICAgICAgID8gYXdhaXQgbWFrZVBlcnBsZXhpdHlDYWxsKG1lc3NhZ2VCb2R5KVxuICAgICAgICA6IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKG1lc3NhZ2VCb2R5IGFzIGFueSlcbiAgICBsZXQgbWVzc2FnZSA9IFtdXG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGxldCBidWZmZXI6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBmaXJzdEZld0xpbWl0ID0gMyAvLyBTZW5kIHRoZSBmaXJzdCAzIGNodW5rcyBpbW1lZGlhdGVseVxuICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDEwMCAvLyBUaGVuIGNvbWJpbmUgMTAgY2h1bmtzIGF0IGEgdGltZVxuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHVzZXJJZCArICcjJyArIERhdGUubm93KCkudG9TdHJpbmcoKVxuXG4gICAgaWYgKCFyZXF1aXJlc0xpdmVEYXRhKSB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3RyZWFtIGFzIGFueSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNodW5rLmNob2ljZXNbMF0/LmRlbHRhPy5jb250ZW50IHx8ICcnXG5cbiAgICAgICAgICAgIC8vIEZvciB0aGUgZmlyc3QgZmV3IGNodW5rcywgc2VuZCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNvdW50IDwgZmlyc3RGZXdMaW1pdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnR290OicsIGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29udGVudCwgZmFsc2UsIG1lc3NhZ2VJZClcbiAgICAgICAgICAgICAgICBjb3VudCA9IGNvdW50ICsgMVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBZnRlciB0aGUgZmlyc3QgZmV3LCBhY2N1bXVsYXRlIGNodW5rcyBpbiBhIGJ1ZmZlclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGNvbnRlbnQpXG5cbiAgICAgICAgICAgICAgICAvLyBPbmNlIHdlJ3ZlIGFjY3VtdWxhdGVkIGVub3VnaCBjaHVua3MgKGJhdGNoU2l6ZSksIHNlbmQgdGhlbSBhcyBvbmUgY29tYmluZWQgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGlmIChidWZmZXIubGVuZ3RoID09PSBiYXRjaFNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyBjb21iaW5lZCBtZXNzYWdlOicsIGNvbWJpbmVkTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29tYmluZWRNZXNzYWdlLCBmYWxzZSwgbWVzc2FnZUlkKVxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnB1c2goY29tYmluZWRNZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBidWZmZXIgYWZ0ZXIgc2VuZGluZ1xuICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBbXVxuICAgICAgICAgICAgICAgICAgICBjb3VudCA9IGNvdW50ICsgMVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEluY3JlbWVudCB0aGUgY291bnRlciBldmVuIHdoZW4gYnVmZmVyaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gW3N0cmVhbT8uY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQgfHwgJyddXG4gICAgfVxuICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nIGNodW5rcyBpbiB0aGUgYnVmZmVyIGFmdGVyIHRoZSBsb29wIGVuZHMsIHNlbmQgdGhlbVxuICAgIGlmIChidWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBjb21iaW5lZE1lc3NhZ2UgPSBidWZmZXIuam9pbignJylcbiAgICAgICAgY29uc29sZS5pbmZvKCdTZW5kaW5nIGZpbmFsIGNvbWJpbmVkIG1lc3NhZ2U6JywgY29tYmluZWRNZXNzYWdlKVxuICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb21iaW5lZE1lc3NhZ2UsIHRydWUsIG1lc3NhZ2VJZClcbiAgICAgICAgbWVzc2FnZS5wdXNoKGNvbWJpbmVkTWVzc2FnZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCAnJywgdHJ1ZSwgbWVzc2FnZUlkKVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZS5qb2luKCcnKVxufVxuXG5leHBvcnQgZW51bSBJbmZvcm1hdGlvbk9wdGlvbnMge1xuICAgICdJTlZFU1RNRU5UUycsXG4gICAgJ1RSQU5TQUNUSU9OUycsXG4gICAgJ0JBTktBQ0NPVU5UUycsXG59XG5leHBvcnQgaW50ZXJmYWNlIEdwdERhdGVSZXNwb25zZSB7XG4gICAgZGF5OiBudW1iZXJcbiAgICBtb250aDogbnVtYmVyXG4gICAgeWVhcjogbnVtYmVyXG59XG5leHBvcnQgaW50ZXJmYWNlIERhdGFSYW5nZVJlc3BvbnNlIHtcbiAgICBzdGFydERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgZW5kRGF5OiBHcHREYXRlUmVzcG9uc2VcbiAgICBoYXNOb1RpbWVDb25zdHJhaW50OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5mb3JtYXRpb25PcHRpb25zUmVzcG9uc2Uge1xuICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogSW5mb3JtYXRpb25PcHRpb25zW11cbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybWF0dGVkQ3VycmVudERhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpIC8vIEdldCB0aGUgY3VycmVudCBkYXRlIGFuZCB0aW1lXG5cbiAgICAvLyBFeHRyYWN0IHllYXIsIG1vbnRoLCBhbmQgZGF5XG4gICAgY29uc3QgeWVhciA9IG5vdy5nZXRGdWxsWWVhcigpXG4gICAgY29uc3QgbW9udGggPSBTdHJpbmcobm93LmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpIC8vIE1vbnRocyBhcmUgMC1iYXNlZCwgc28gYWRkIDFcbiAgICBjb25zdCBkYXkgPSBTdHJpbmcobm93LmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKVxuXG4gICAgLy8gUmV0dXJuIHRoZSBmb3JtYXR0ZWQgZGF0ZSBhcyAnWVlZWS1NTS1ERCdcbiAgICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9YFxufVxuXG5leHBvcnQgY29uc3QgZ2V0RGF0ZVJhbmdlRnJvbU1vZGVsID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSA9IHoub2JqZWN0KHtcbiAgICAgICAgc3RhcnREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGVuZERheTogei5vYmplY3Qoe1xuICAgICAgICAgICAgZGF5OiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgbW9udGg6IHoubnVtYmVyKCksXG4gICAgICAgICAgICB5ZWFyOiB6Lm51bWJlcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgaGFzTm9UaW1lQ29uc3RyYWludDogei5ib29sZWFuKCksXG4gICAgfSlcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnVGhlIGN1cnJlbnQgZGF0ZSBpcyAnICtcbiAgICAgICAgICAgICAgICAgICAgZ2V0Rm9ybWF0dGVkQ3VycmVudERhdGUoKSArXG4gICAgICAgICAgICAgICAgICAgICcgRmlsbCBvdXQgdGhlIGJlc3Qgc3VpdGVkIGRhdGUgcmFuZ2UgZm9yIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgK1xuICAgICAgICAgICAgICAgICAgICBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlVmFsdWVzRm9yRGF0ZVJhbmdlLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmV4cG9ydCBjb25zdCBnZXROZWVkZWRJbmZvcm1hdGlvbkZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIG5lZWRlZCBpbmZvcm1hdGlvbicpXG4gICAgY29uc3QgQWNjZXB0YWJsZUluZm9ybWF0aW9uT3B0aW9ucyA9IHoub2JqZWN0KHtcbiAgICAgICAgb3B0aW9uc0ZvckluZm9ybWF0aW9uOiB6LmFycmF5KHouZW51bShbJ0lOVkVTVE1FTlRTJywgJ1RSQU5TQUNUSU9OUycsICdCQU5LQUNDT1VOVFMnXSkpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1doYXQgaW5mb3JtYXRpb24gaXMgYmVzdCBzdWl0ZWQgdG8gYW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgKyBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmNvbnN0IGZsYXR0ZW4gPSAodmFsdWU6IGFueSk6IGFueVtdID0+IHtcbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGZsYXR0ZW4gZWFjaCBlbGVtZW50IHJlY3Vyc2l2ZWx5XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5mbGF0TWFwKGZsYXR0ZW4pIC8vIFVzZSBmbGF0TWFwIHRvIGZsYXR0ZW4gdGhlIGFycmF5IHJlY3Vyc2l2ZWx5XG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3QsIGZsYXR0ZW4gaXRzIHZhbHVlcyByZWN1cnNpdmVseVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXModmFsdWUpKVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LCByZXR1cm4gaXQgYXMgYSBzaW5nbGUtZWxlbWVudCBhcnJheVxuICAgIHJldHVybiBbdmFsdWVdXG59XG5cbmV4cG9ydCBjb25zdCBnZXRUZWNobmljYWxXb3Jkc1doZXJlV2VDYW5Hb0RlZXBlciA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgJ1dlIGFyZSBzdW1tYXJpemluZyBmaW5hbmNpYWwgaW5mb3JtYXRpb24gcmV0dXJuIHRoZSBleGFjdCBwaHJhc2VzIChpbmNsdWRlIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgcHVuY3R1YXRpb24pIHdoZXJlIHdlIGNvdWxkIGRvIGZpbmFuY2lhbCBhbmFseXNpcyBpbnRvIHRoZSB0b3BpYy4gIHJlc3BvbmQgaW4gdGhlIGpzb24gZm9ybWF0IFtwaHJhc2UxLCBwaHJhc2UyXV0nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfSxcbiAgICAgICAgICAgIG1vZGVsOiAnZ3B0LTMuNS10dXJibycsXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGpzb25PYmplY3QgPSBKU09OLnBhcnNlKGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIS5jb250ZW50IHx8ICcnKVxuICAgICAgICBpZiAoanNvbk9iamVjdC5waHJhc2UxIHx8IGpzb25PYmplY3QucGhyYXNlcyB8fCBPYmplY3Qua2V5cyhqc29uT2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKGpzb25PYmplY3QpKVxuICAgICAgICB9IGVsc2UgaWYgKGpzb25PYmplY3QubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihqc29uT2JqZWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBbXVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUFzc2lzdGFudCA9IGFzeW5jICgpID0+XG4gICAgYXBpQ2xpZW50LmJldGEuYXNzaXN0YW50cy5jcmVhdGUoe1xuICAgICAgICBpbnN0cnVjdGlvbnM6XG4gICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gd3JpdGUgYW5kIHJ1biBjb2RlIHRvIGFuc3dlciB0aGUgcXVlc3Rpb24uJyxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IHVwbG9hZEZpbGVUb0Fzc2lzdGFudCA9IGFzeW5jIChmaWxlOiBGaWxlKSA9PiB7XG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zdCBmaWxlUmV0dXJuID0gYXdhaXQgYXBpQ2xpZW50LmZpbGVzLmNyZWF0ZSh7XG4gICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgIHB1cnBvc2U6ICdhc3Npc3RhbnRzJyxcbiAgICB9KVxuICAgIHJldHVybiBmaWxlUmV0dXJuXG59XG5cbmV4cG9ydCBjb25zdCBjb2RlSW50ZXJwZXJ0ZXJGb3JBbmFseXNpcyA9IGFzeW5jIChmaWxlSWRzOiBzdHJpbmdbXSwgYXNzaXN0YW50X2lkOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGhyZWFkID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgYXR0YWNobWVudHM6IGZpbGVJZHMubWFwKChmaWxlSWQpID0+ICh7IGZpbGVfaWQ6IGZpbGVJZCwgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSB9KSksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pXG4gICAgcmV0dXJuIHRocmVhZFxufVxuXG5leHBvcnQgY29uc3QgcnVuVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcsIGFzc2lzdGFudF9pZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcnVuUGFyYW1zID0ge1xuICAgICAgICBhc3Npc3RhbnRfaWQ6IGFzc2lzdGFudF9pZCxcbiAgICAgICAgdG9vbF9jaG9pY2U6IHsgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH0gYXMgQXNzaXN0YW50VG9vbENob2ljZSxcbiAgICB9XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5ydW5zLmNyZWF0ZUFuZFBvbGwodGhyZWFkSWQsIHJ1blBhcmFtcylcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKHN0YXR1cylcbiAgICByZXR1cm4gc3RhdHVzXG59XG5cbmV4cG9ydCBjb25zdCBsaXN0TWVzc2FnZXNGb3JUaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5tZXNzYWdlcy5saXN0KHRocmVhZElkKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2cobWVzc2FnZXMpXG4gICAgcmV0dXJuIG1lc3NhZ2VzXG59XG5cbmV4cG9ydCBjb25zdCBzZW5kQ2hhdFRvVUkgPSBhc3luYyAoXG4gICAgcGs6IHN0cmluZyxcbiAgICBzazogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBpc0xhc3RDaHVuazogYm9vbGVhbixcbiAgICBtZXNzYWdlSWQ6IHN0cmluZ1xuKSA9PiB7XG4gICAgY29uc3QgY2hhdElucHV0OiBDaGF0SW5wdXQgPSB7XG4gICAgICAgIHBrOiBwayxcbiAgICAgICAgc2s6IHNrLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB0aW1lOiBEYXRlLm5vdygpLnRvU3RyaW5nKCksXG4gICAgICAgIGlzTGFzdENodW5rLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgfVxuXG4gICAgLy8gUHJlcGFyZSBHcmFwaFFMIHJlcXVlc3QgcGF5bG9hZFxuICAgIGNvbnN0IGdyYXBocWxEYXRhID0ge1xuICAgICAgICBxdWVyeTogY3JlYXRlQ2hhdCxcbiAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBjaGF0OiBjaGF0SW5wdXQsXG4gICAgICAgIH0sXG4gICAgfVxuICAgIGNvbnN0IHBvc3RCb2R5ID0gSlNPTi5zdHJpbmdpZnkoZ3JhcGhxbERhdGEpXG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjcmVkZW50aWFscyA9IGF3YWl0IGRlZmF1bHRQcm92aWRlcigpKClcbiAgICAgICAgY29uc3QgdXJpID0gbmV3IFVSTChhcHBzeW5jVXJsKVxuICAgICAgICBjb25zdCBodHRwUmVxdWVzdCA9IHtcbiAgICAgICAgICAgIGhvc3RuYW1lOiB1cmkuaG9zdG5hbWUsXG4gICAgICAgICAgICBwYXRoOiB1cmkucGF0aG5hbWUsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBob3N0OiB1cmkuaG9zdG5hbWUsXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBwb3N0Qm9keSxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBhIHNpZ25lciBvYmplY3RcbiAgICAgICAgY29uc3Qgc2lnbmVyID0gYXdzNC5zaWduKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlZ2lvbjogJ2NhLWNlbnRyYWwtMScsXG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2FwcHN5bmMnLCAvLyBBcHBTeW5jIGlzIHRoZSBzZXJ2aWNlIHdlJ3JlIGludGVyYWN0aW5nIHdpdGhcbiAgICAgICAgICAgICAgICBwYXRoOiBodHRwUmVxdWVzdC5wYXRoLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IGh0dHBSZXF1ZXN0LmhlYWRlcnMsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBodHRwUmVxdWVzdC5tZXRob2QsXG4gICAgICAgICAgICAgICAgYm9keTogaHR0cFJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYWNjZXNzS2V5SWQ6IGNyZWRlbnRpYWxzLmFjY2Vzc0tleUlkLFxuICAgICAgICAgICAgICAgIHNlY3JldEFjY2Vzc0tleTogY3JlZGVudGlhbHMuc2VjcmV0QWNjZXNzS2V5LFxuICAgICAgICAgICAgICAgIHNlc3Npb25Ub2tlbjogY3JlZGVudGlhbHMuc2Vzc2lvblRva2VuLFxuICAgICAgICAgICAgfVxuICAgICAgICApXG5cbiAgICAgICAgLy8gU2lnbiB0aGUgcmVxdWVzdFxuICAgICAgICBPYmplY3QuYXNzaWduKGh0dHBSZXF1ZXN0LmhlYWRlcnMsIHNpZ25lci5oZWFkZXJzKVxuXG4gICAgICAgIC8vIE1ha2UgdGhlIEhUVFAgcmVxdWVzdFxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVyaS5ocmVmLCBodHRwUmVxdWVzdClcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBKU09OIFJlc3BvbnNlID0gJHtKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKX1gKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZFVENIIEVSUk9SOiAke0pTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKX1gKVxuICAgIH1cbn1cbiJdfQ==