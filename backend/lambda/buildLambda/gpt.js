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
const SimulationExpansionResponseFormat = zod_1.z.object({
    newCode: zod_1.z.string(),
});
const SimulationPreExpansionResponseFormat = zod_1.z.object({
    highLevelDescriptionOfIdeaWithoutMentioningCode: zod_1.z.string(),
    inputKeys: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), defaultValue: zod_1.z.string() })),
    title: zod_1.z.string(),
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
    const doesStreamRes = chatType !== API_1.ChatType.FinancialNewsQuery &&
        chatType !== API_1.ChatType.FinancialAnalysisQuery &&
        chatType !== API_1.ChatType.TransactionRecommendation &&
        chatType !== API_1.ChatType.SimulationExpansion &&
        chatType !== API_1.ChatType.GeneralRecommendation &&
        chatType !== API_1.ChatType.SimulationPreExpansion &&
        chatType !== API_1.ChatType.RetryCodeBuild; // stream to get faster
    const systemPrompt = chatType === API_1.ChatType.FinancialNewsQuery
        ? stockPrompts_1.newsPrompt
        : chatType === API_1.ChatType.FinancialAnalysisQuery
            ? stockPrompts_1.technicalPrompt
            : chatType === API_1.ChatType.SimulationExpansion
                ? stockPrompts_1.expansionPrompt
                : chatType === API_1.ChatType.SimulationPreExpansion
                    ? stockPrompts_1.preExpansionPrompt
                    : chatType === API_1.ChatType.RetryCodeBuild
                        ? 'Fix the error from the attached code files, also fix any other potential errors, do not use any backticks in your python code'
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
                : chatType === API_1.ChatType.SimulationExpansion || chatType === API_1.ChatType.RetryCodeBuild
                    ? (0, zod_2.zodResponseFormat)(SimulationExpansionResponseFormat, 'simulationExpansion')
                    : chatType === API_1.ChatType.SimulationPreExpansion
                        ? (0, zod_2.zodResponseFormat)(SimulationPreExpansionResponseFormat, 'simulationPreExpansion')
                        : undefined,
        model,
        stream: doesStreamRes ? true : false,
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
    if (!requiresLiveData && doesStreamRes) {
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            // For the first few chunks, send immediately
            if (count < firstFewLimit) {
                console.info('Got:', content);
                message.push(content);
                doesStreamRes && (0, exports.sendChatToUI)(userId, count.toString(), content, false, messageId);
                count = count + 1;
            }
            else {
                // After the first few, accumulate chunks in a buffer
                buffer.push(content);
                // Once we've accumulated enough chunks (batchSize), send them as one combined message
                if (buffer.length === batchSize) {
                    const combinedMessage = buffer.join('');
                    console.info('Sending combined message:', combinedMessage);
                    doesStreamRes && (0, exports.sendChatToUI)(userId, count.toString(), combinedMessage, false, messageId);
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
        doesStreamRes && (0, exports.sendChatToUI)(userId, count.toString(), combinedMessage, true, messageId);
        message.push(combinedMessage);
    }
    else {
        doesStreamRes && (0, exports.sendChatToUI)(userId, count.toString(), '', true, messageId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUV0RCwrQkFBb0Y7QUFDcEYsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFDNUIsaURBQWlHO0FBQ2pHLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsR0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLGtDQUE0QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxRyxNQUFNLFdBQVcsR0FBRyxVQUFtQyxDQUFBO0FBRXZELE1BQU0sK0JBQStCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxXQUFXLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN2QixNQUFNLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FDWCxPQUFDLENBQUMsTUFBTSxDQUFDO1FB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QUMsQ0FBQTtRQUNuRCxNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUVsQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25FLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0FBQ0wsQ0FBQyxDQUFBO0FBcEVZLFFBQUEsWUFBWSxnQkFvRXhCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9wZW5BSSBmcm9tICdvcGVuYWknXG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJ1xuaW1wb3J0IHsgem9kUmVzcG9uc2VGb3JtYXQgfSBmcm9tICdvcGVuYWkvaGVscGVycy96b2QnXG5pbXBvcnQgeyBBc3Npc3RhbnRUb29sQ2hvaWNlIH0gZnJvbSAnb3BlbmFpL3Jlc291cmNlcy9iZXRhL3RocmVhZHMvdGhyZWFkcydcbmltcG9ydCB7IENoYXRGb2N1cywgQ2hhdElucHV0LCBDaGF0VHlwZSwgSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeSB9IGZyb20gJy4vQVBJJ1xuaW1wb3J0IHsgY3JlYXRlQ2hhdCB9IGZyb20gJy4vZ3JhcGhxbC9tdXRhdGlvbnMnXG5pbXBvcnQgeyBkZWZhdWx0UHJvdmlkZXIgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLW5vZGUnXG5pbXBvcnQgKiBhcyBhd3M0IGZyb20gJ2F3czQnXG5pbXBvcnQgeyBleHBhbnNpb25Qcm9tcHQsIG5ld3NQcm9tcHQsIHByZUV4cGFuc2lvblByb21wdCwgdGVjaG5pY2FsUHJvbXB0IH0gZnJvbSAnLi9zdG9ja1Byb21wdHMnXG5jb25zdCBhcHBzeW5jVXJsID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19VUkwgYXMgc3RyaW5nXG5jb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5BUFBTWU5DX0FQSV9LRVkgYXMgc3RyaW5nXG5cbmNvbnN0IHJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIHRyYW5zZmVyczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgYW1vdW50OiB6LnN0cmluZygpLFxuICAgICAgICAgICAgZnJvbUFjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgdG9BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBoaWdoTGV2ZWxDYXRlZ29yeTogSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeVxuICAgIHRpbWVmcmFtZTogQnVkZ2V0VGltZWZyYW1lXG4gICAgc3BlbmRpbmdUaHJlc2hvbGQ6IEZsb2F0XG4gICAgY3JlYXRlZEF0OiBTdHJpbmdcbiAgICBzcGVjaWZpY1BheWVlUmVnZXg6IFN0cmluZ1xuICovXG5jb25zdCBjYXRlZ29yaWVzOiBzdHJpbmdbXSA9IE9iamVjdC5rZXlzKEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnkpLmZpbHRlcigoa2V5KSA9PiBpc05hTihOdW1iZXIoa2V5KSkpXG5jb25zdCB0dXBsZVZhbHVlcyA9IGNhdGVnb3JpZXMgYXMgW3N0cmluZywgLi4uc3RyaW5nW11dXG5cbmNvbnN0IHRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25BY3Rpb24gPSB6Lm9iamVjdCh7XG4gICAgZGVzY3JpcHRpb246IHouc3RyaW5nKCksXG4gICAgYnVkZ2V0OiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICB0aW1lZnJhbWU6IHouZW51bShbJ0RBSUxZJywgJ1dFRUtMWScsICdNT05USExZJ10pLFxuICAgICAgICAgICAgc3BlbmRpbmdUaHJlc2hvbGQ6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBoaWdoTGV2ZWxDYXRlZ29yeTogei5lbnVtKHR1cGxlVmFsdWVzKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlRm9ybWF0ID0gei5vYmplY3Qoe1xuICAgIG5ld0NvZGU6IHouc3RyaW5nKCksXG59KVxuXG5jb25zdCBTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQgPSB6Lm9iamVjdCh7XG4gICAgaGlnaExldmVsRGVzY3JpcHRpb25PZklkZWFXaXRob3V0TWVudGlvbmluZ0NvZGU6IHouc3RyaW5nKCksXG4gICAgaW5wdXRLZXlzOiB6LmFycmF5KHoub2JqZWN0KHsgbmFtZTogei5zdHJpbmcoKSwgZGVmYXVsdFZhbHVlOiB6LnN0cmluZygpIH0pKSxcbiAgICB0aXRsZTogei5zdHJpbmcoKSxcbn0pXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlSW50ZXJmYWNlIHtcbiAgICBuZXdDb2RlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VJbnRlcmZhY2Uge1xuICAgIGhpZ2hMZXZlbERlc2NyaXB0aW9uT2ZJZGVhV2l0aG91dE1lbnRpb25pbmdDb2RlOiBzdHJpbmdcbiAgICBpbnB1dEtleXM6IHtcbiAgICAgICAgbmFtZTogc3RyaW5nXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogc3RyaW5nXG4gICAgfVtdXG4gICAgdGl0bGU6IHN0cmluZ1xufVxuXG5jb25zdCBSZWNvbW1lbmRhdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogcmVjb21tZW5kYXRpb25BY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHByaW9yaXR5OiB6LmVudW0oWydIaWdoJywgJ01lZGl1bScsICdMb3cnXSksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogdHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBcbiAqIHR5cGUgR3JhcGhUeXBlIHtcbiAgICBwaWVDaGFydDogU3RyaW5nXG4gICAgYmFyQ2hhcnQ6IFN0cmluZ1xuICAgIGhpc3RvZ3JhbTogU3RyaW5nXG4gICAgdGltZVBsb3Q6IFN0cmluZ1xufVxuICogdHlwZSBQcmVtaXVtQ2hhdFJlc3BvbnNlIHtcbiAgICByZXNwb25zZTogU3RyaW5nXG4gICAgZ3JhcGhzOiBHcmFwaFR5cGVcbiAqL1xuXG5jb25zdCBQcmVtaXVtQ2hhdFJlc3BvbnNlID0gei5vYmplY3Qoe1xuICAgIHJlc3BvbnNlOiB6LnN0cmluZygpLFxufSlcblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlciB7XG4gICAgZnJvbUFjY291bnROYW1lOiBzdHJpbmdcbiAgICB0b0FjY291bnROYW1lOiBzdHJpbmdcbiAgICBhbW91bnQ6IHN0cmluZ1xufVxuaW50ZXJmYWNlIFJlY29tbWVuZGF0aW9uQWN0aW9uIHtcbiAgICB0cmFuc2ZlcnM6IFRyYW5zZmVyW11cbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb21tZW5kYXRpb24ge1xuICAgIGV4cGxhbmF0aW9uOiBzdHJpbmdcbiAgICBhY3Rpb246IFJlY29tbWVuZGF0aW9uQWN0aW9uXG4gICAgdGl0bGU6IHN0cmluZ1xuICAgIHByaW9yaXR5OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IGFwaUNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgIGFwaUtleTogcHJvY2Vzcy5lbnZbJ0dwdFNlY3JldEtleSddISxcbiAgICBkYW5nZXJvdXNseUFsbG93QnJvd3NlcjogZmFsc2UsXG59KVxuXG5jb25zdCBjaGF0ID0gYXBpQ2xpZW50LmNoYXRcblxuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc0Zyb21EYXRhID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChSZWNvbW1lbmRhdGlvbnMsICdyZWNvbW1lbmRhdGlvbnMnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgbWFrZVBlcnBsZXhpdHlDYWxsID0gYXN5bmMgKGJvZHk6IGFueSkgPT4ge1xuICAgIGRlbGV0ZSBib2R5WydyZXNwb25zZV9mb3JtYXQnXVxuICAgIGRlbGV0ZSBib2R5WydzdHJlYW0nXVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLnBlcnBsZXhpdHkuYWkvY2hhdC9jb21wbGV0aW9ucycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBwcm9jZXNzLmVudi5QZXJwbGV4aXR5U2VjcmV0S2V5LFxuICAgICAgICB9IGFzIGFueSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgfSlcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIC8vIExvZyB0aGUgZXJyb3IgcmVzcG9uc2UgZm9yIGRlYnVnZ2luZ1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgUmVzcG9uc2U6JywgZXJyb3JUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFQSSByZXF1ZXN0IGZhaWxlZCB3aXRoIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c306ICR7ZXJyb3JUZXh0fWApXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgSlNPTi4gUmVzcG9uc2Ugd2FzOicsIHJlc3BvbnNlVGV4dClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBUEkgcmV0dXJuZWQgbm9uLUpTT04gcmVzcG9uc2UnKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBsZXRlQ2hhdEZyb21Qcm9tcHQgPSBhc3luYyAoXG4gICAgcHJvbXB0OiBzdHJpbmcsXG4gICAgdHlwZTogQ2hhdEZvY3VzIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICByZXF1aXJlc0xpdmVEYXRhOiBib29sZWFuLFxuICAgIGNoYXRUeXBlOiBDaGF0VHlwZVxuKSA9PiB7XG4gICAgY29uc3QgZG9lc1N0cmVhbVJlcyA9XG4gICAgICAgIGNoYXRUeXBlICE9PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnkgJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnkgJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLlNpbXVsYXRpb25FeHBhbnNpb24gJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvbiAmJlxuICAgICAgICBjaGF0VHlwZSAhPT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvbiAmJlxuICAgICAgICBjaGF0VHlwZSAhPT0gQ2hhdFR5cGUuUmV0cnlDb2RlQnVpbGQgLy8gc3RyZWFtIHRvIGdldCBmYXN0ZXJcbiAgICBjb25zdCBzeXN0ZW1Qcm9tcHQgPVxuICAgICAgICBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsTmV3c1F1ZXJ5XG4gICAgICAgICAgICA/IG5ld3NQcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnlcbiAgICAgICAgICAgID8gdGVjaG5pY2FsUHJvbXB0XG4gICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uXG4gICAgICAgICAgICA/IGV4cGFuc2lvblByb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvblxuICAgICAgICAgICAgPyBwcmVFeHBhbnNpb25Qcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlJldHJ5Q29kZUJ1aWxkXG4gICAgICAgICAgICA/ICdGaXggdGhlIGVycm9yIGZyb20gdGhlIGF0dGFjaGVkIGNvZGUgZmlsZXMsIGFsc28gZml4IGFueSBvdGhlciBwb3RlbnRpYWwgZXJyb3JzLCBkbyBub3QgdXNlIGFueSBiYWNrdGlja3MgaW4geW91ciBweXRob24gY29kZSdcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgID8gYFlvdSBhcmUgYSBwZXJzb25hbCBzcGVuZGluZyBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBZb3UgcHJvdmlkZSBzcGVuZGluZyByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwuYFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuR2VuZXJhbFJlY29tbWVuZGF0aW9uXG4gICAgICAgICAgICA/ICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJ1xuICAgICAgICAgICAgOiBgWW91IGFyZSBhIHBlcnNvbmFsICR7XG4gICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgIH0gYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gYFxuICAgIGNvbnN0IG1vZGVsID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeSB8fCBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyAnbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lJ1xuICAgICAgICAgICAgOiAnZ3B0LTRvJ1xuICAgIGNvbnN0IG1lc3NhZ2VCb2R5ID0ge1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN5c3RlbVByb21wdCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OlxuICAgICAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgICAgICA/IHpvZFJlc3BvbnNlRm9ybWF0KFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24sICdyZWNvbW1lbmRhdGlvbnMnKVxuICAgICAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvblxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoUmVjb21tZW5kYXRpb25zLCAncmVjb21tZW5kYXRpb25zJylcbiAgICAgICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uIHx8IGNoYXRUeXBlID09PSBDaGF0VHlwZS5SZXRyeUNvZGVCdWlsZFxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlRm9ybWF0LCAnc2ltdWxhdGlvbkV4cGFuc2lvbicpXG4gICAgICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvblxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoU2ltdWxhdGlvblByZUV4cGFuc2lvblJlc3BvbnNlRm9ybWF0LCAnc2ltdWxhdGlvblByZUV4cGFuc2lvbicpXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgIG1vZGVsLFxuICAgICAgICBzdHJlYW06IGRvZXNTdHJlYW1SZXMgPyB0cnVlIDogZmFsc2UsXG4gICAgfVxuICAgIGNvbnN0IHN0cmVhbSA9IHJlcXVpcmVzTGl2ZURhdGFcbiAgICAgICAgPyBhd2FpdCBtYWtlUGVycGxleGl0eUNhbGwobWVzc2FnZUJvZHkpXG4gICAgICAgIDogYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUobWVzc2FnZUJvZHkgYXMgYW55KVxuICAgIGxldCBtZXNzYWdlID0gW11cbiAgICBsZXQgY291bnQgPSAwXG4gICAgbGV0IGJ1ZmZlcjogc3RyaW5nW10gPSBbXVxuICAgIGNvbnN0IGZpcnN0RmV3TGltaXQgPSAzIC8vIFNlbmQgdGhlIGZpcnN0IDMgY2h1bmtzIGltbWVkaWF0ZWx5XG4gICAgY29uc3QgYmF0Y2hTaXplID0gMTAwIC8vIFRoZW4gY29tYmluZSAxMCBjaHVua3MgYXQgYSB0aW1lXG4gICAgY29uc3QgbWVzc2FnZUlkID0gdXNlcklkICsgJyMnICsgRGF0ZS5ub3coKS50b1N0cmluZygpXG5cbiAgICBpZiAoIXJlcXVpcmVzTGl2ZURhdGEgJiYgZG9lc1N0cmVhbVJlcykge1xuICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHN0cmVhbSBhcyBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBjaHVuay5jaG9pY2VzWzBdPy5kZWx0YT8uY29udGVudCB8fCAnJ1xuXG4gICAgICAgICAgICAvLyBGb3IgdGhlIGZpcnN0IGZldyBjaHVua3MsIHNlbmQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjb3VudCA8IGZpcnN0RmV3TGltaXQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0dvdDonLCBjb250ZW50KVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UucHVzaChjb250ZW50KVxuICAgICAgICAgICAgICAgIGRvZXNTdHJlYW1SZXMgJiYgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29udGVudCwgZmFsc2UsIG1lc3NhZ2VJZClcbiAgICAgICAgICAgICAgICBjb3VudCA9IGNvdW50ICsgMVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBZnRlciB0aGUgZmlyc3QgZmV3LCBhY2N1bXVsYXRlIGNodW5rcyBpbiBhIGJ1ZmZlclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGNvbnRlbnQpXG5cbiAgICAgICAgICAgICAgICAvLyBPbmNlIHdlJ3ZlIGFjY3VtdWxhdGVkIGVub3VnaCBjaHVua3MgKGJhdGNoU2l6ZSksIHNlbmQgdGhlbSBhcyBvbmUgY29tYmluZWQgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGlmIChidWZmZXIubGVuZ3RoID09PSBiYXRjaFNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyBjb21iaW5lZCBtZXNzYWdlOicsIGNvbWJpbmVkTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgZG9lc1N0cmVhbVJlcyAmJiBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb21iaW5lZE1lc3NhZ2UsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UucHVzaChjb21iaW5lZE1lc3NhZ2UpXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGJ1ZmZlciBhZnRlciBzZW5kaW5nXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IFtdXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ID0gY291bnQgKyAxXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW5jcmVtZW50IHRoZSBjb3VudGVyIGV2ZW4gd2hlbiBidWZmZXJpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBbc3RyZWFtPy5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudCB8fCAnJ11cbiAgICB9XG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSByZW1haW5pbmcgY2h1bmtzIGluIHRoZSBidWZmZXIgYWZ0ZXIgdGhlIGxvb3AgZW5kcywgc2VuZCB0aGVtXG4gICAgaWYgKGJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGNvbWJpbmVkTWVzc2FnZSA9IGJ1ZmZlci5qb2luKCcnKVxuICAgICAgICBjb25zb2xlLmluZm8oJ1NlbmRpbmcgZmluYWwgY29tYmluZWQgbWVzc2FnZTonLCBjb21iaW5lZE1lc3NhZ2UpXG4gICAgICAgIGRvZXNTdHJlYW1SZXMgJiYgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29tYmluZWRNZXNzYWdlLCB0cnVlLCBtZXNzYWdlSWQpXG4gICAgICAgIG1lc3NhZ2UucHVzaChjb21iaW5lZE1lc3NhZ2UpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZG9lc1N0cmVhbVJlcyAmJiBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCAnJywgdHJ1ZSwgbWVzc2FnZUlkKVxuICAgIH1cblxuICAgIHJldHVybiBtZXNzYWdlLmpvaW4oJycpXG59XG5cbmV4cG9ydCBlbnVtIEluZm9ybWF0aW9uT3B0aW9ucyB7XG4gICAgJ0lOVkVTVE1FTlRTJyxcbiAgICAnVFJBTlNBQ1RJT05TJyxcbiAgICAnQUNDT1VOVFMnLFxuICAgICdNT05USExZU1VNTUFSSUVTJyxcbn1cbmV4cG9ydCBpbnRlcmZhY2UgR3B0RGF0ZVJlc3BvbnNlIHtcbiAgICBkYXk6IG51bWJlclxuICAgIG1vbnRoOiBudW1iZXJcbiAgICB5ZWFyOiBudW1iZXJcbn1cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVJhbmdlUmVzcG9uc2Uge1xuICAgIHN0YXJ0RGF5OiBHcHREYXRlUmVzcG9uc2VcbiAgICBlbmREYXk6IEdwdERhdGVSZXNwb25zZVxuICAgIGhhc05vVGltZUNvbnN0cmFpbnQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmZvcm1hdGlvbk9wdGlvbnNSZXNwb25zZSB7XG4gICAgb3B0aW9uc0ZvckluZm9ybWF0aW9uOiBJbmZvcm1hdGlvbk9wdGlvbnNbXVxufVxuXG5mdW5jdGlvbiBnZXRGb3JtYXR0ZWRDdXJyZW50RGF0ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkgLy8gR2V0IHRoZSBjdXJyZW50IGRhdGUgYW5kIHRpbWVcblxuICAgIC8vIEV4dHJhY3QgeWVhciwgbW9udGgsIGFuZCBkYXlcbiAgICBjb25zdCB5ZWFyID0gbm93LmdldEZ1bGxZZWFyKClcbiAgICBjb25zdCBtb250aCA9IFN0cmluZyhub3cuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJykgLy8gTW9udGhzIGFyZSAwLWJhc2VkLCBzbyBhZGQgMVxuICAgIGNvbnN0IGRheSA9IFN0cmluZyhub3cuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCAnMCcpXG5cbiAgICAvLyBSZXR1cm4gdGhlIGZvcm1hdHRlZCBkYXRlIGFzICdZWVlZLU1NLUREJ1xuICAgIHJldHVybiBgJHt5ZWFyfS0ke21vbnRofS0ke2RheX1gXG59XG5cbmV4cG9ydCBjb25zdCBnZXREYXRlUmFuZ2VGcm9tTW9kZWwgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBBY2NlcHRhYmxlVmFsdWVzRm9yRGF0ZVJhbmdlID0gei5vYmplY3Qoe1xuICAgICAgICBzdGFydERheTogei5vYmplY3Qoe1xuICAgICAgICAgICAgZGF5OiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgbW9udGg6IHoubnVtYmVyKCksXG4gICAgICAgICAgICB5ZWFyOiB6Lm51bWJlcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgZW5kRGF5OiB6Lm9iamVjdCh7XG4gICAgICAgICAgICBkYXk6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBtb250aDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIHllYXI6IHoubnVtYmVyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBoYXNOb1RpbWVDb25zdHJhaW50OiB6LmJvb2xlYW4oKSxcbiAgICB9KVxuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICdUaGUgY3VycmVudCBkYXRlIGlzICcgK1xuICAgICAgICAgICAgICAgICAgICBnZXRGb3JtYXR0ZWRDdXJyZW50RGF0ZSgpICtcbiAgICAgICAgICAgICAgICAgICAgJyBGaWxsIG91dCB0aGUgYmVzdCBzdWl0ZWQgZGF0ZSByYW5nZSBmb3IgdGhlIGZvbGxvd2luZyBxdWVyeTogJyArXG4gICAgICAgICAgICAgICAgICAgIHByb21wdC5zdWJzdHJpbmcoMCwgMTAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KEFjY2VwdGFibGVWYWx1ZXNGb3JEYXRlUmFuZ2UsICdkYXRlUmFuZ2UnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuZXhwb3J0IGNvbnN0IGdldE5lZWRlZEluZm9ybWF0aW9uRnJvbU1vZGVsID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmcgbmVlZGVkIGluZm9ybWF0aW9uJylcbiAgICBjb25zdCBBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zID0gei5vYmplY3Qoe1xuICAgICAgICBvcHRpb25zRm9ySW5mb3JtYXRpb246IHouYXJyYXkoei5lbnVtKFsnSU5WRVNUTUVOVFMnLCAnVFJBTlNBQ1RJT05TJywgJ0FDQ09VTlRTJ10pKSxcbiAgICB9KVxuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdXaGF0IGluZm9ybWF0aW9uIGlzIGJlc3Qgc3VpdGVkIHRvIGFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiAnICsgcHJvbXB0LnN1YnN0cmluZygwLCAxMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoQWNjZXB0YWJsZUluZm9ybWF0aW9uT3B0aW9ucywgJ2RhdGVSYW5nZScpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5jb25zdCBmbGF0dGVuID0gKHZhbHVlOiBhbnkpOiBhbnlbXSA9PiB7XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBmbGF0dGVuIGVhY2ggZWxlbWVudCByZWN1cnNpdmVseVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUuZmxhdE1hcChmbGF0dGVuKSAvLyBVc2UgZmxhdE1hcCB0byBmbGF0dGVuIHRoZSBhcnJheSByZWN1cnNpdmVseVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0LCBmbGF0dGVuIGl0cyB2YWx1ZXMgcmVjdXJzaXZlbHlcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKHZhbHVlKSlcbiAgICB9XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIG5laXRoZXIgYW4gYXJyYXkgbm9yIGFuIG9iamVjdCwgcmV0dXJuIGl0IGFzIGEgc2luZ2xlLWVsZW1lbnQgYXJyYXlcbiAgICByZXR1cm4gW3ZhbHVlXVxufVxuXG5leHBvcnQgY29uc3QgZ2V0VGVjaG5pY2FsV29yZHNXaGVyZVdlQ2FuR29EZWVwZXIgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgICdXZSBhcmUgc3VtbWFyaXppbmcgZmluYW5jaWFsIGluZm9ybWF0aW9uIHJldHVybiB0aGUgZXhhY3QgcGhyYXNlcyAoaW5jbHVkZSBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIHB1bmN0dWF0aW9uKSB3aGVyZSB3ZSBjb3VsZCBkbyBmaW5hbmNpYWwgYW5hbHlzaXMgaW50byB0aGUgdG9waWMuICByZXNwb25kIGluIHRoZSBqc29uIGZvcm1hdCBbcGhyYXNlMSwgcGhyYXNlMl1dJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogeyB0eXBlOiAnanNvbl9vYmplY3QnIH0sXG4gICAgICAgICAgICBtb2RlbDogJ2dwdC0zLjUtdHVyYm8nLFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBqc29uT2JqZWN0ID0gSlNPTi5wYXJzZShjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSEuY29udGVudCB8fCAnJylcbiAgICAgICAgaWYgKGpzb25PYmplY3QucGhyYXNlMSB8fCBqc29uT2JqZWN0LnBocmFzZXMgfHwgT2JqZWN0LmtleXMoanNvbk9iamVjdCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZsYXR0ZW4oT2JqZWN0LnZhbHVlcyhqc29uT2JqZWN0KSlcbiAgICAgICAgfSBlbHNlIGlmIChqc29uT2JqZWN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZsYXR0ZW4oanNvbk9iamVjdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gW11cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVBc3Npc3RhbnQgPSBhc3luYyAoKSA9PlxuICAgIGFwaUNsaWVudC5iZXRhLmFzc2lzdGFudHMuY3JlYXRlKHtcbiAgICAgICAgaW5zdHJ1Y3Rpb25zOlxuICAgICAgICAgICAgJ1lvdSBhcmUgYSBwZXJzb25hbCBmaW5hbmNlIGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIHdyaXRlIGFuZCBydW4gY29kZSB0byBhbnN3ZXIgdGhlIHF1ZXN0aW9uLicsXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgICB0b29sczogW3sgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH1dLFxuICAgIH0pXG5cbmV4cG9ydCBjb25zdCB1cGxvYWRGaWxlVG9Bc3Npc3RhbnQgPSBhc3luYyAoZmlsZTogRmlsZSkgPT4ge1xuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc3QgZmlsZVJldHVybiA9IGF3YWl0IGFwaUNsaWVudC5maWxlcy5jcmVhdGUoe1xuICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICBwdXJwb3NlOiAnYXNzaXN0YW50cycsXG4gICAgfSlcbiAgICByZXR1cm4gZmlsZVJldHVyblxufVxuXG5leHBvcnQgY29uc3QgY29kZUludGVycGVydGVyRm9yQW5hbHlzaXMgPSBhc3luYyAoZmlsZUlkczogc3RyaW5nW10sIGFzc2lzdGFudF9pZDogc3RyaW5nLCBwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHRocmVhZCA9IGF3YWl0IGFwaUNsaWVudC5iZXRhLnRocmVhZHMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LFxuICAgICAgICAgICAgICAgIGF0dGFjaG1lbnRzOiBmaWxlSWRzLm1hcCgoZmlsZUlkKSA9PiAoeyBmaWxlX2lkOiBmaWxlSWQsIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0gfSkpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9KVxuICAgIHJldHVybiB0aHJlYWRcbn1cblxuZXhwb3J0IGNvbnN0IHJ1blRocmVhZCA9IGFzeW5jICh0aHJlYWRJZDogc3RyaW5nLCBhc3Npc3RhbnRfaWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHJ1blBhcmFtcyA9IHtcbiAgICAgICAgYXNzaXN0YW50X2lkOiBhc3Npc3RhbnRfaWQsXG4gICAgICAgIHRvb2xfY2hvaWNlOiB7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9IGFzIEFzc2lzdGFudFRvb2xDaG9pY2UsXG4gICAgfVxuICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGFwaUNsaWVudC5iZXRhLnRocmVhZHMucnVucy5jcmVhdGVBbmRQb2xsKHRocmVhZElkLCBydW5QYXJhbXMpXG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zb2xlLmxvZyhzdGF0dXMpXG4gICAgcmV0dXJuIHN0YXR1c1xufVxuXG5leHBvcnQgY29uc3QgbGlzdE1lc3NhZ2VzRm9yVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBtZXNzYWdlcyA9IGF3YWl0IGFwaUNsaWVudC5iZXRhLnRocmVhZHMubWVzc2FnZXMubGlzdCh0aHJlYWRJZClcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2VzKVxuICAgIHJldHVybiBtZXNzYWdlc1xufVxuXG5leHBvcnQgY29uc3Qgc2VuZENoYXRUb1VJID0gYXN5bmMgKFxuICAgIHBrOiBzdHJpbmcsXG4gICAgc2s6IHN0cmluZyxcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgaXNMYXN0Q2h1bms6IGJvb2xlYW4sXG4gICAgbWVzc2FnZUlkOiBzdHJpbmdcbikgPT4ge1xuICAgIC8vIFRPRE86IGV4cGlyZSB0aGUgY2hhdHNcbiAgICBjb25zdCBjaGF0SW5wdXQ6IENoYXRJbnB1dCA9IHtcbiAgICAgICAgcGs6IHBrLFxuICAgICAgICBzazogc2ssXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHRpbWU6IERhdGUubm93KCkudG9TdHJpbmcoKSxcbiAgICAgICAgaXNMYXN0Q2h1bmssXG4gICAgICAgIG1lc3NhZ2VJZCxcbiAgICB9XG5cbiAgICAvLyBQcmVwYXJlIEdyYXBoUUwgcmVxdWVzdCBwYXlsb2FkXG4gICAgY29uc3QgZ3JhcGhxbERhdGEgPSB7XG4gICAgICAgIHF1ZXJ5OiBjcmVhdGVDaGF0LFxuICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgIGNoYXQ6IGNoYXRJbnB1dCxcbiAgICAgICAgfSxcbiAgICB9XG4gICAgY29uc3QgcG9zdEJvZHkgPSBKU09OLnN0cmluZ2lmeShncmFwaHFsRGF0YSlcblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNyZWRlbnRpYWxzID0gYXdhaXQgZGVmYXVsdFByb3ZpZGVyKCkoKVxuICAgICAgICBjb25zdCB1cmkgPSBuZXcgVVJMKGFwcHN5bmNVcmwpXG4gICAgICAgIGNvbnN0IGh0dHBSZXF1ZXN0ID0ge1xuICAgICAgICAgICAgaG9zdG5hbWU6IHVyaS5ob3N0bmFtZSxcbiAgICAgICAgICAgIHBhdGg6IHVyaS5wYXRobmFtZSxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIGhvc3Q6IHVyaS5ob3N0bmFtZSxcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IHBvc3RCb2R5LFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgc2lnbmVyIG9iamVjdFxuICAgICAgICBjb25zdCBzaWduZXIgPSBhd3M0LnNpZ24oXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVnaW9uOiAnY2EtY2VudHJhbC0xJyxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlOiAnYXBwc3luYycsIC8vIEFwcFN5bmMgaXMgdGhlIHNlcnZpY2Ugd2UncmUgaW50ZXJhY3Rpbmcgd2l0aFxuICAgICAgICAgICAgICAgIHBhdGg6IGh0dHBSZXF1ZXN0LnBhdGgsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogaHR0cFJlcXVlc3QuaGVhZGVycyxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IGh0dHBSZXF1ZXN0Lm1ldGhvZCxcbiAgICAgICAgICAgICAgICBib2R5OiBodHRwUmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhY2Nlc3NLZXlJZDogY3JlZGVudGlhbHMuYWNjZXNzS2V5SWQsXG4gICAgICAgICAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBjcmVkZW50aWFscy5zZWNyZXRBY2Nlc3NLZXksXG4gICAgICAgICAgICAgICAgc2Vzc2lvblRva2VuOiBjcmVkZW50aWFscy5zZXNzaW9uVG9rZW4sXG4gICAgICAgICAgICB9XG4gICAgICAgIClcblxuICAgICAgICAvLyBTaWduIHRoZSByZXF1ZXN0XG4gICAgICAgIE9iamVjdC5hc3NpZ24oaHR0cFJlcXVlc3QuaGVhZGVycywgc2lnbmVyLmhlYWRlcnMpXG5cbiAgICAgICAgLy8gTWFrZSB0aGUgSFRUUCByZXF1ZXN0XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJpLmhyZWYsIGh0dHBSZXF1ZXN0KVxuICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG5cbiAgICAgICAgY29uc29sZS5sb2coYEpTT04gUmVzcG9uc2UgPSAke0pTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpfWApXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRkVUQ0ggRVJST1I6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpfWApXG4gICAgfVxufVxuIl19