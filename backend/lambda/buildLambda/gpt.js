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
async function processStreamedResponse(stream, userId, messageId, firstFewLimit = 3, batchSize = 25) {
    const reader = stream.body?.getReader();
    if (!reader) {
        throw new TypeError('Stream is not readable');
    }
    const decoder = new TextDecoder();
    let done = false;
    let count = 0;
    const message = [];
    let buffer = [];
    while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
            const decodedChunk = decoder.decode(value, { stream: true });
            try {
                console.info('Got and decoded', decodedChunk, value);
                const parsedChunk = JSON.parse(decodedChunk);
                const content = parsedChunk.choices[0]?.delta?.content || '';
                if (count < firstFewLimit) {
                    // For the first few chunks, send immediately
                    console.info('Got:', content);
                    message.push(content);
                    (0, exports.sendChatToUI)(userId, count.toString(), content, false, messageId);
                    count++;
                }
                else {
                    // After the first few, accumulate chunks in a buffer
                    buffer.push(content);
                    // Once we've accumulated enough chunks (batchSize), send them as one combined message
                    if (buffer.length >= batchSize) {
                        const combinedMessage = buffer.join('');
                        console.info('Sending combined message:', combinedMessage);
                        (0, exports.sendChatToUI)(userId, count.toString(), combinedMessage, false, messageId);
                        message.push(combinedMessage);
                        // Reset the buffer after sending
                        buffer = [];
                        count++;
                    }
                }
            }
            catch (error) {
                console.error('Error parsing chunk:', error, decodedChunk);
            }
        }
    }
    // If there's any remaining content in the buffer after the stream ends, send it
    const remainingMessage = buffer.join('');
    console.info('Sending remaining buffered message:', remainingMessage);
    (0, exports.sendChatToUI)(userId, count.toString(), remainingMessage, true, messageId);
    message.push(remainingMessage);
    return message;
}
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
    const batchSize = 10; // Then combine 10 chunks at a time
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQTRCO0FBQzVCLDRDQUFzRDtBQUd0RCwrQkFBc0Q7QUFDdEQsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFFNUIsaURBQTREO0FBQzVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRixNQUFNLGVBQWUsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQzdCLGVBQWUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNwQixPQUFDLENBQUMsTUFBTSxDQUFDO1FBQ0wsV0FBVyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUU7UUFDdkIsTUFBTSxFQUFFLG9CQUFvQjtRQUM1QixLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNqQixRQUFRLEVBQUUsT0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUMsQ0FBQyxDQUNMO0NBQ0osQ0FBQyxDQUFBO0FBRUY7Ozs7Ozs7Ozs7O0dBV0c7QUFF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LEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUE7UUFFbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbkUsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQW5FWSxRQUFBLFlBQVksZ0JBbUV4QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSAnb3BlbmFpJ1xuaW1wb3J0IHsgYW55LCB6IH0gZnJvbSAnem9kJ1xuaW1wb3J0IHsgem9kUmVzcG9uc2VGb3JtYXQgfSBmcm9tICdvcGVuYWkvaGVscGVycy96b2QnXG5pbXBvcnQgeyBBc3Npc3RhbnRUb29sQ2hvaWNlIH0gZnJvbSAnb3BlbmFpL3Jlc291cmNlcy9iZXRhL3RocmVhZHMvdGhyZWFkcydcbmltcG9ydCB7IHN0YXQgfSBmcm9tICdmcydcbmltcG9ydCB7IENoYXRGb2N1cywgQ2hhdElucHV0LCBDaGF0VHlwZSB9IGZyb20gJy4vQVBJJ1xuaW1wb3J0IHsgY3JlYXRlQ2hhdCB9IGZyb20gJy4vZ3JhcGhxbC9tdXRhdGlvbnMnXG5pbXBvcnQgeyBkZWZhdWx0UHJvdmlkZXIgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLW5vZGUnXG5pbXBvcnQgKiBhcyBhd3M0IGZyb20gJ2F3czQnXG5pbXBvcnQgeyBTaWduYXR1cmVWNCB9IGZyb20gJ0Bhd3Mtc2RrL3NpZ25hdHVyZS12NCdcbmltcG9ydCB7IG5ld3NQcm9tcHQsIHRlY2huaWNhbFByb21wdCB9IGZyb20gJy4vc3RvY2tQcm9tcHRzJ1xuY29uc3QgYXBwc3luY1VybCA9IHByb2Nlc3MuZW52LkFQUFNZTkNfVVJMIGFzIHN0cmluZ1xuY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19BUElfS0VZIGFzIHN0cmluZ1xuXG5jb25zdCByZWNvbW1lbmRhdGlvbkFjdGlvbiA9IHoub2JqZWN0KHtcbiAgICBkZXNjcmlwdGlvbjogei5zdHJpbmcoKSxcbiAgICB0cmFuc2ZlcnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGFtb3VudDogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGZyb21BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHRvQWNjb3VudE5hbWU6IHouc3RyaW5nKCksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFJlY29tbWVuZGF0aW9ucyA9IHoub2JqZWN0KHtcbiAgICByZWNvbW1lbmRhdGlvbnM6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgYWN0aW9uOiByZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBcbiAqIHR5cGUgR3JhcGhUeXBlIHtcbiAgICBwaWVDaGFydDogU3RyaW5nXG4gICAgYmFyQ2hhcnQ6IFN0cmluZ1xuICAgIGhpc3RvZ3JhbTogU3RyaW5nXG4gICAgdGltZVBsb3Q6IFN0cmluZ1xufVxuICogdHlwZSBQcmVtaXVtQ2hhdFJlc3BvbnNlIHtcbiAgICByZXNwb25zZTogU3RyaW5nXG4gICAgZ3JhcGhzOiBHcmFwaFR5cGVcbiAqL1xuXG5jb25zdCBQcmVtaXVtQ2hhdFJlc3BvbnNlID0gei5vYmplY3Qoe1xuICAgIHJlc3BvbnNlOiB6LnN0cmluZygpLFxuICAgIGdyYXBoczogei5vYmplY3Qoe1xuICAgICAgICBwaWVDaGFydDogei5zdHJpbmcoKSxcbiAgICAgICAgYmFyQ2hhcnQ6IHouc3RyaW5nKCksXG4gICAgICAgIGhpc3RvZ3JhbTogei5zdHJpbmcoKSxcbiAgICAgICAgdGltZVBsb3Q6IHouc3RyaW5nKCksXG4gICAgfSksXG59KVxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZmVyIHtcbiAgICBmcm9tQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIHRvQWNjb3VudE5hbWU6IHN0cmluZ1xuICAgIGFtb3VudDogc3RyaW5nXG59XG5pbnRlcmZhY2UgUmVjb21tZW5kYXRpb25BY3Rpb24ge1xuICAgIHRyYW5zZmVyczogVHJhbnNmZXJbXVxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWNvbW1lbmRhdGlvbiB7XG4gICAgZXhwbGFuYXRpb246IHN0cmluZ1xuICAgIGFjdGlvbjogUmVjb21tZW5kYXRpb25BY3Rpb25cbiAgICB0aXRsZTogc3RyaW5nXG4gICAgcHJpb3JpdHk6IG51bWJlclxufVxuXG5leHBvcnQgY29uc3QgYXBpQ2xpZW50ID0gbmV3IE9wZW5BSSh7XG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudlsnR3B0U2VjcmV0S2V5J10hLFxuICAgIGRhbmdlcm91c2x5QWxsb3dCcm93c2VyOiBmYWxzZSxcbn0pXG5cbmNvbnN0IGNoYXQgPSBhcGlDbGllbnQuY2hhdFxuXG5leHBvcnQgY29uc3QgZ2V0RmluYW5jaWFsUmVjb21tZW5kYXRpb25zRnJvbURhdGEgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8nLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KFJlY29tbWVuZGF0aW9ucywgJ3JlY29tbWVuZGF0aW9ucycpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5jb25zdCBtYWtlUGVycGxleGl0eUNhbGwgPSBhc3luYyAoYm9keTogYW55KSA9PiB7XG4gICAgZGVsZXRlIGJvZHlbJ3Jlc3BvbnNlX2Zvcm1hdCddXG4gICAgZGVsZXRlIGJvZHlbJ3N0cmVhbSddXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucGVycGxleGl0eS5haS9jaGF0L2NvbXBsZXRpb25zJywge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IHByb2Nlc3MuZW52LlBlcnBsZXhpdHlTZWNyZXRLZXksXG4gICAgICAgIH0gYXMgYW55LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICB9KVxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgLy8gTG9nIHRoZSBlcnJvciByZXNwb25zZSBmb3IgZGVidWdnaW5nXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBSZXNwb25zZTonLCBlcnJvclRleHQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIHJlcXVlc3QgZmFpbGVkIHdpdGggc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHR9YClcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBKU09OLiBSZXNwb25zZSB3YXM6JywgcmVzcG9uc2VUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FQSSByZXR1cm5lZCBub24tSlNPTiByZXNwb25zZScpXG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzU3RyZWFtZWRSZXNwb25zZShcbiAgICBzdHJlYW06IFJlc3BvbnNlLFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIG1lc3NhZ2VJZDogc3RyaW5nLFxuICAgIGZpcnN0RmV3TGltaXQgPSAzLFxuICAgIGJhdGNoU2l6ZSA9IDI1XG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVhZGVyID0gc3RyZWFtLmJvZHk/LmdldFJlYWRlcigpXG4gICAgaWYgKCFyZWFkZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RyZWFtIGlzIG5vdCByZWFkYWJsZScpXG4gICAgfVxuXG4gICAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpXG4gICAgbGV0IGRvbmUgPSBmYWxzZVxuICAgIGxldCBjb3VudCA9IDBcbiAgICBjb25zdCBtZXNzYWdlOiBzdHJpbmdbXSA9IFtdXG4gICAgbGV0IGJ1ZmZlcjogc3RyaW5nW10gPSBbXVxuXG4gICAgd2hpbGUgKCFkb25lKSB7XG4gICAgICAgIGNvbnN0IHsgdmFsdWUsIGRvbmU6IHN0cmVhbURvbmUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKClcbiAgICAgICAgZG9uZSA9IHN0cmVhbURvbmVcblxuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlY29kZWRDaHVuayA9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0dvdCBhbmQgZGVjb2RlZCcsIGRlY29kZWRDaHVuaywgdmFsdWUpXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkQ2h1bms6IGFueSA9IEpTT04ucGFyc2UoZGVjb2RlZENodW5rKVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBwYXJzZWRDaHVuay5jaG9pY2VzWzBdPy5kZWx0YT8uY29udGVudCB8fCAnJ1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvdW50IDwgZmlyc3RGZXdMaW1pdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgdGhlIGZpcnN0IGZldyBjaHVua3MsIHNlbmQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdHb3Q6JywgY29udGVudClcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbnRlbnQsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBZnRlciB0aGUgZmlyc3QgZmV3LCBhY2N1bXVsYXRlIGNodW5rcyBpbiBhIGJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICBidWZmZXIucHVzaChjb250ZW50KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIE9uY2Ugd2UndmUgYWNjdW11bGF0ZWQgZW5vdWdoIGNodW5rcyAoYmF0Y2hTaXplKSwgc2VuZCB0aGVtIGFzIG9uZSBjb21iaW5lZCBtZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIGlmIChidWZmZXIubGVuZ3RoID49IGJhdGNoU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1NlbmRpbmcgY29tYmluZWQgbWVzc2FnZTonLCBjb21iaW5lZE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb21iaW5lZE1lc3NhZ2UsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnB1c2goY29tYmluZWRNZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgYnVmZmVyIGFmdGVyIHNlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgY2h1bms6JywgZXJyb3IsIGRlY29kZWRDaHVuaylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZXJlJ3MgYW55IHJlbWFpbmluZyBjb250ZW50IGluIHRoZSBidWZmZXIgYWZ0ZXIgdGhlIHN0cmVhbSBlbmRzLCBzZW5kIGl0XG4gICAgY29uc3QgcmVtYWluaW5nTWVzc2FnZSA9IGJ1ZmZlci5qb2luKCcnKVxuICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyByZW1haW5pbmcgYnVmZmVyZWQgbWVzc2FnZTonLCByZW1haW5pbmdNZXNzYWdlKVxuICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIHJlbWFpbmluZ01lc3NhZ2UsIHRydWUsIG1lc3NhZ2VJZClcbiAgICBtZXNzYWdlLnB1c2gocmVtYWluaW5nTWVzc2FnZSlcbiAgICByZXR1cm4gbWVzc2FnZVxufVxuXG5leHBvcnQgY29uc3QgY29tcGxldGVDaGF0RnJvbVByb21wdCA9IGFzeW5jIChcbiAgICBwcm9tcHQ6IHN0cmluZyxcbiAgICB0eXBlOiBDaGF0Rm9jdXMgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHJlcXVpcmVzTGl2ZURhdGE6IGJvb2xlYW4sXG4gICAgY2hhdFR5cGU6IENoYXRUeXBlXG4pID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VuZGluZycsIHByb21wdCwgJyB0byBncHQnKVxuICAgIGNvbnN0IHN5c3RlbVByb21wdCA9XG4gICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnlcbiAgICAgICAgICAgID8gbmV3c1Byb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyB0ZWNobmljYWxQcm9tcHRcbiAgICAgICAgICAgIDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgdHlwZSAmJiB0eXBlICE9PSBDaGF0Rm9jdXMuQWxsID8gdHlwZSA6ICdGaW5hbmNlJ1xuICAgICAgICAgICAgICB9IGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIFlvdSBwbG90IGRhdGEgdG8gYmVhdXRpZnVsIHN2Z3Mgd2hlbiBpdCBpcyBoZWxwZnVsLmBcbiAgICBjb25zdCBtb2RlbCA9XG4gICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnkgfHwgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnlcbiAgICAgICAgICAgID8gJ2xsYW1hLTMuMS1zb25hci1sYXJnZS0xMjhrLW9ubGluZSdcbiAgICAgICAgICAgIDogJ2dwdC00bydcbiAgICBjb25zdCBtZXNzYWdlQm9keSA9IHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoUHJlbWl1bUNoYXRSZXNwb25zZSwgJ2ZpbmFuY2lhbGNoYXRyZXNwb25zZScpLFxuICAgICAgICBtb2RlbCxcbiAgICAgICAgc3RyZWFtOiB0cnVlLFxuICAgIH1cbiAgICBjb25zdCBzdHJlYW0gPSByZXF1aXJlc0xpdmVEYXRhXG4gICAgICAgID8gYXdhaXQgbWFrZVBlcnBsZXhpdHlDYWxsKG1lc3NhZ2VCb2R5KVxuICAgICAgICA6IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKG1lc3NhZ2VCb2R5IGFzIGFueSlcbiAgICBsZXQgbWVzc2FnZSA9IFtdXG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGxldCBidWZmZXI6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBmaXJzdEZld0xpbWl0ID0gMyAvLyBTZW5kIHRoZSBmaXJzdCAzIGNodW5rcyBpbW1lZGlhdGVseVxuICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDEwIC8vIFRoZW4gY29tYmluZSAxMCBjaHVua3MgYXQgYSB0aW1lXG4gICAgY29uc3QgbWVzc2FnZUlkID0gdXNlcklkICsgJyMnICsgRGF0ZS5ub3coKS50b1N0cmluZygpXG5cbiAgICBpZiAoIXJlcXVpcmVzTGl2ZURhdGEpIHtcbiAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBzdHJlYW0gYXMgYW55KSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gY2h1bmsuY2hvaWNlc1swXT8uZGVsdGE/LmNvbnRlbnQgfHwgJydcblxuICAgICAgICAgICAgLy8gRm9yIHRoZSBmaXJzdCBmZXcgY2h1bmtzLCBzZW5kIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY291bnQgPCBmaXJzdEZld0xpbWl0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdHb3Q6JywgY29udGVudClcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnB1c2goY29udGVudClcbiAgICAgICAgICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb250ZW50LCBmYWxzZSwgbWVzc2FnZUlkKVxuICAgICAgICAgICAgICAgIGNvdW50ID0gY291bnQgKyAxXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCBmZXcsIGFjY3VtdWxhdGUgY2h1bmtzIGluIGEgYnVmZmVyXG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goY29udGVudClcblxuICAgICAgICAgICAgICAgIC8vIE9uY2Ugd2UndmUgYWNjdW11bGF0ZWQgZW5vdWdoIGNodW5rcyAoYmF0Y2hTaXplKSwgc2VuZCB0aGVtIGFzIG9uZSBjb21iaW5lZCBtZXNzYWdlXG4gICAgICAgICAgICAgICAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IGJhdGNoU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE1lc3NhZ2UgPSBidWZmZXIuam9pbignJylcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdTZW5kaW5nIGNvbWJpbmVkIG1lc3NhZ2U6JywgY29tYmluZWRNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb21iaW5lZE1lc3NhZ2UsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UucHVzaChjb21iaW5lZE1lc3NhZ2UpXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGJ1ZmZlciBhZnRlciBzZW5kaW5nXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IFtdXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ID0gY291bnQgKyAxXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW5jcmVtZW50IHRoZSBjb3VudGVyIGV2ZW4gd2hlbiBidWZmZXJpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBbc3RyZWFtPy5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudCB8fCAnJ11cbiAgICB9XG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSByZW1haW5pbmcgY2h1bmtzIGluIHRoZSBidWZmZXIgYWZ0ZXIgdGhlIGxvb3AgZW5kcywgc2VuZCB0aGVtXG4gICAgaWYgKGJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGNvbWJpbmVkTWVzc2FnZSA9IGJ1ZmZlci5qb2luKCcnKVxuICAgICAgICBjb25zb2xlLmluZm8oJ1NlbmRpbmcgZmluYWwgY29tYmluZWQgbWVzc2FnZTonLCBjb21iaW5lZE1lc3NhZ2UpXG4gICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbWJpbmVkTWVzc2FnZSwgdHJ1ZSwgbWVzc2FnZUlkKVxuICAgICAgICBtZXNzYWdlLnB1c2goY29tYmluZWRNZXNzYWdlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksICcnLCB0cnVlLCBtZXNzYWdlSWQpXG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlLmpvaW4oJycpXG59XG5cbmV4cG9ydCBlbnVtIEluZm9ybWF0aW9uT3B0aW9ucyB7XG4gICAgJ0lOVkVTVE1FTlRTJyxcbiAgICAnVFJBTlNBQ1RJT05TJyxcbiAgICAnQkFOS0FDQ09VTlRTJyxcbn1cbmV4cG9ydCBpbnRlcmZhY2UgR3B0RGF0ZVJlc3BvbnNlIHtcbiAgICBkYXk6IG51bWJlclxuICAgIG1vbnRoOiBudW1iZXJcbiAgICB5ZWFyOiBudW1iZXJcbn1cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVJhbmdlUmVzcG9uc2Uge1xuICAgIHN0YXJ0RGF5OiBHcHREYXRlUmVzcG9uc2VcbiAgICBlbmREYXk6IEdwdERhdGVSZXNwb25zZVxuICAgIGhhc05vVGltZUNvbnN0cmFpbnQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmZvcm1hdGlvbk9wdGlvbnNSZXNwb25zZSB7XG4gICAgb3B0aW9uc0ZvckluZm9ybWF0aW9uOiBJbmZvcm1hdGlvbk9wdGlvbnNbXVxufVxuXG5mdW5jdGlvbiBnZXRGb3JtYXR0ZWRDdXJyZW50RGF0ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkgLy8gR2V0IHRoZSBjdXJyZW50IGRhdGUgYW5kIHRpbWVcblxuICAgIC8vIEV4dHJhY3QgeWVhciwgbW9udGgsIGFuZCBkYXlcbiAgICBjb25zdCB5ZWFyID0gbm93LmdldEZ1bGxZZWFyKClcbiAgICBjb25zdCBtb250aCA9IFN0cmluZyhub3cuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJykgLy8gTW9udGhzIGFyZSAwLWJhc2VkLCBzbyBhZGQgMVxuICAgIGNvbnN0IGRheSA9IFN0cmluZyhub3cuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCAnMCcpXG5cbiAgICAvLyBSZXR1cm4gdGhlIGZvcm1hdHRlZCBkYXRlIGFzICdZWVlZLU1NLUREJ1xuICAgIHJldHVybiBgJHt5ZWFyfS0ke21vbnRofS0ke2RheX1gXG59XG5cbmV4cG9ydCBjb25zdCBnZXREYXRlUmFuZ2VGcm9tTW9kZWwgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBBY2NlcHRhYmxlVmFsdWVzRm9yRGF0ZVJhbmdlID0gei5vYmplY3Qoe1xuICAgICAgICBzdGFydERheTogei5vYmplY3Qoe1xuICAgICAgICAgICAgZGF5OiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgbW9udGg6IHoubnVtYmVyKCksXG4gICAgICAgICAgICB5ZWFyOiB6Lm51bWJlcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgZW5kRGF5OiB6Lm9iamVjdCh7XG4gICAgICAgICAgICBkYXk6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBtb250aDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIHllYXI6IHoubnVtYmVyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBoYXNOb1RpbWVDb25zdHJhaW50OiB6LmJvb2xlYW4oKSxcbiAgICB9KVxuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdUaGUgY3VycmVudCBkYXRlIGlzICcgK1xuICAgICAgICAgICAgICAgICAgICBnZXRGb3JtYXR0ZWRDdXJyZW50RGF0ZSgpICtcbiAgICAgICAgICAgICAgICAgICAgJyBGaWxsIG91dCB0aGUgYmVzdCBzdWl0ZWQgZGF0ZSByYW5nZSBmb3IgdGhlIGZvbGxvd2luZyBxdWVyeTogJyArXG4gICAgICAgICAgICAgICAgICAgIHByb21wdC5zdWJzdHJpbmcoMCwgMTAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KEFjY2VwdGFibGVWYWx1ZXNGb3JEYXRlUmFuZ2UsICdkYXRlUmFuZ2UnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuZXhwb3J0IGNvbnN0IGdldE5lZWRlZEluZm9ybWF0aW9uRnJvbU1vZGVsID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmcgbmVlZGVkIGluZm9ybWF0aW9uJylcbiAgICBjb25zdCBBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zID0gei5vYmplY3Qoe1xuICAgICAgICBvcHRpb25zRm9ySW5mb3JtYXRpb246IHouYXJyYXkoei5lbnVtKFsnSU5WRVNUTUVOVFMnLCAnVFJBTlNBQ1RJT05TJywgJ0JBTktBQ0NPVU5UUyddKSksXG4gICAgfSlcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnV2hhdCBpbmZvcm1hdGlvbiBpcyBiZXN0IHN1aXRlZCB0byBhbnN3ZXIgdGhlIGZvbGxvd2luZyBxdWVyeTogJyArIHByb21wdC5zdWJzdHJpbmcoMCwgMTAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KEFjY2VwdGFibGVJbmZvcm1hdGlvbk9wdGlvbnMsICdkYXRlUmFuZ2UnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgZmxhdHRlbiA9ICh2YWx1ZTogYW55KTogYW55W10gPT4ge1xuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgZmxhdHRlbiBlYWNoIGVsZW1lbnQgcmVjdXJzaXZlbHlcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLmZsYXRNYXAoZmxhdHRlbikgLy8gVXNlIGZsYXRNYXAgdG8gZmxhdHRlbiB0aGUgYXJyYXkgcmVjdXJzaXZlbHlcbiAgICB9XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCwgZmxhdHRlbiBpdHMgdmFsdWVzIHJlY3Vyc2l2ZWx5XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZsYXR0ZW4oT2JqZWN0LnZhbHVlcyh2YWx1ZSkpXG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhbiBvYmplY3QsIHJldHVybiBpdCBhcyBhIHNpbmdsZS1lbGVtZW50IGFycmF5XG4gICAgcmV0dXJuIFt2YWx1ZV1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFRlY2huaWNhbFdvcmRzV2hlcmVXZUNhbkdvRGVlcGVyID0gYXN5bmMgKHByb21wdDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAnV2UgYXJlIHN1bW1hcml6aW5nIGZpbmFuY2lhbCBpbmZvcm1hdGlvbiByZXR1cm4gdGhlIGV4YWN0IHBocmFzZXMgKGluY2x1ZGUgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBwdW5jdHVhdGlvbikgd2hlcmUgd2UgY291bGQgZG8gZmluYW5jaWFsIGFuYWx5c2lzIGludG8gdGhlIHRvcGljLiAgcmVzcG9uZCBpbiB0aGUganNvbiBmb3JtYXQgW3BocmFzZTEsIHBocmFzZTJdXScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LnN1YnN0cmluZygwLCAyMDAwMCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogJ2pzb25fb2JqZWN0JyB9LFxuICAgICAgICAgICAgbW9kZWw6ICdncHQtMy41LXR1cmJvJyxcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QganNvbk9iamVjdCA9IEpTT04ucGFyc2UoY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhLmNvbnRlbnQgfHwgJycpXG4gICAgICAgIGlmIChqc29uT2JqZWN0LnBocmFzZTEgfHwganNvbk9iamVjdC5waHJhc2VzIHx8IE9iamVjdC5rZXlzKGpzb25PYmplY3QpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXMoanNvbk9iamVjdCkpXG4gICAgICAgIH0gZWxzZSBpZiAoanNvbk9iamVjdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKGpzb25PYmplY3QpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQXNzaXN0YW50ID0gYXN5bmMgKCkgPT5cbiAgICBhcGlDbGllbnQuYmV0YS5hc3Npc3RhbnRzLmNyZWF0ZSh7XG4gICAgICAgIGluc3RydWN0aW9uczpcbiAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiB3cml0ZSBhbmQgcnVuIGNvZGUgdG8gYW5zd2VyIHRoZSBxdWVzdGlvbi4nLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgdXBsb2FkRmlsZVRvQXNzaXN0YW50ID0gYXN5bmMgKGZpbGU6IEZpbGUpID0+IHtcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnN0IGZpbGVSZXR1cm4gPSBhd2FpdCBhcGlDbGllbnQuZmlsZXMuY3JlYXRlKHtcbiAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgcHVycG9zZTogJ2Fzc2lzdGFudHMnLFxuICAgIH0pXG4gICAgcmV0dXJuIGZpbGVSZXR1cm5cbn1cblxuZXhwb3J0IGNvbnN0IGNvZGVJbnRlcnBlcnRlckZvckFuYWx5c2lzID0gYXN5bmMgKGZpbGVJZHM6IHN0cmluZ1tdLCBhc3Npc3RhbnRfaWQ6IHN0cmluZywgcHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0aHJlYWQgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdCxcbiAgICAgICAgICAgICAgICBhdHRhY2htZW50czogZmlsZUlkcy5tYXAoKGZpbGVJZCkgPT4gKHsgZmlsZV9pZDogZmlsZUlkLCB0b29sczogW3sgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH1dIH0pKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSlcbiAgICByZXR1cm4gdGhyZWFkXG59XG5cbmV4cG9ydCBjb25zdCBydW5UaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZywgYXNzaXN0YW50X2lkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBydW5QYXJhbXMgPSB7XG4gICAgICAgIGFzc2lzdGFudF9pZDogYXNzaXN0YW50X2lkLFxuICAgICAgICB0b29sX2Nob2ljZTogeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfSBhcyBBc3Npc3RhbnRUb29sQ2hvaWNlLFxuICAgIH1cbiAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLnJ1bnMuY3JlYXRlQW5kUG9sbCh0aHJlYWRJZCwgcnVuUGFyYW1zKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2coc3RhdHVzKVxuICAgIHJldHVybiBzdGF0dXNcbn1cblxuZXhwb3J0IGNvbnN0IGxpc3RNZXNzYWdlc0ZvclRocmVhZCA9IGFzeW5jICh0aHJlYWRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLm1lc3NhZ2VzLmxpc3QodGhyZWFkSWQpXG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlcylcbiAgICByZXR1cm4gbWVzc2FnZXNcbn1cblxuZXhwb3J0IGNvbnN0IHNlbmRDaGF0VG9VSSA9IGFzeW5jIChcbiAgICBwazogc3RyaW5nLFxuICAgIHNrOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGlzTGFzdENodW5rOiBib29sZWFuLFxuICAgIG1lc3NhZ2VJZDogc3RyaW5nXG4pID0+IHtcbiAgICBjb25zdCBjaGF0SW5wdXQ6IENoYXRJbnB1dCA9IHtcbiAgICAgICAgcGs6IHBrLFxuICAgICAgICBzazogc2ssXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHRpbWU6IERhdGUubm93KCkudG9TdHJpbmcoKSxcbiAgICAgICAgaXNMYXN0Q2h1bmssXG4gICAgICAgIG1lc3NhZ2VJZCxcbiAgICB9XG5cbiAgICAvLyBQcmVwYXJlIEdyYXBoUUwgcmVxdWVzdCBwYXlsb2FkXG4gICAgY29uc3QgZ3JhcGhxbERhdGEgPSB7XG4gICAgICAgIHF1ZXJ5OiBjcmVhdGVDaGF0LFxuICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgIGNoYXQ6IGNoYXRJbnB1dCxcbiAgICAgICAgfSxcbiAgICB9XG4gICAgY29uc3QgcG9zdEJvZHkgPSBKU09OLnN0cmluZ2lmeShncmFwaHFsRGF0YSlcblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNyZWRlbnRpYWxzID0gYXdhaXQgZGVmYXVsdFByb3ZpZGVyKCkoKVxuICAgICAgICBjb25zdCB1cmkgPSBuZXcgVVJMKGFwcHN5bmNVcmwpXG4gICAgICAgIGNvbnN0IGh0dHBSZXF1ZXN0ID0ge1xuICAgICAgICAgICAgaG9zdG5hbWU6IHVyaS5ob3N0bmFtZSxcbiAgICAgICAgICAgIHBhdGg6IHVyaS5wYXRobmFtZSxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIGhvc3Q6IHVyaS5ob3N0bmFtZSxcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IHBvc3RCb2R5LFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgc2lnbmVyIG9iamVjdFxuICAgICAgICBjb25zdCBzaWduZXIgPSBhd3M0LnNpZ24oXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVnaW9uOiAnY2EtY2VudHJhbC0xJyxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlOiAnYXBwc3luYycsIC8vIEFwcFN5bmMgaXMgdGhlIHNlcnZpY2Ugd2UncmUgaW50ZXJhY3Rpbmcgd2l0aFxuICAgICAgICAgICAgICAgIHBhdGg6IGh0dHBSZXF1ZXN0LnBhdGgsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogaHR0cFJlcXVlc3QuaGVhZGVycyxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IGh0dHBSZXF1ZXN0Lm1ldGhvZCxcbiAgICAgICAgICAgICAgICBib2R5OiBodHRwUmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhY2Nlc3NLZXlJZDogY3JlZGVudGlhbHMuYWNjZXNzS2V5SWQsXG4gICAgICAgICAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBjcmVkZW50aWFscy5zZWNyZXRBY2Nlc3NLZXksXG4gICAgICAgICAgICAgICAgc2Vzc2lvblRva2VuOiBjcmVkZW50aWFscy5zZXNzaW9uVG9rZW4sXG4gICAgICAgICAgICB9XG4gICAgICAgIClcblxuICAgICAgICAvLyBTaWduIHRoZSByZXF1ZXN0XG4gICAgICAgIE9iamVjdC5hc3NpZ24oaHR0cFJlcXVlc3QuaGVhZGVycywgc2lnbmVyLmhlYWRlcnMpXG5cbiAgICAgICAgLy8gTWFrZSB0aGUgSFRUUCByZXF1ZXN0XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJpLmhyZWYsIGh0dHBSZXF1ZXN0KVxuICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG5cbiAgICAgICAgY29uc29sZS5sb2coYEpTT04gUmVzcG9uc2UgPSAke0pTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpfWApXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRkVUQ0ggRVJST1I6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpfWApXG4gICAgfVxufVxuIl19