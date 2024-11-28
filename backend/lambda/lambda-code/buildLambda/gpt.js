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
                            : chatType === API_1.ChatType.RecommendBudget
                                ? `You are a personal spending assistant in Canada. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. You provide budget recommendations which are highly useful for longterm growth. Provide a budget for each relevant category from the monthly summarys.`
                                : chatType === API_1.ChatType.GeneralRecommendation
                                    ? 'You are a personal finance assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. Leave the transfer information empty if no transfer is needed'
                                    : `You are a personal ${type && type !== API_1.ChatFocus.All ? type : 'Finance'} assistant. You leverage detailed knoweldge of jurisdictional tax laws and financial optimization strategies to guide us to make better financial decisions. You are currently being used in a chat context, you must provide very concise replies to not bore the human you are talking to. `;
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
        response_format: chatType === API_1.ChatType.TransactionRecommendation || chatType === API_1.ChatType.RecommendBudget
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUV0RCwrQkFBb0Y7QUFDcEYsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFDNUIsaURBQWlHO0FBQ2pHLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsR0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLGtDQUE0QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxRyxNQUFNLFdBQVcsR0FBRyxVQUFtQyxDQUFBO0FBRXZELE1BQU0sK0JBQStCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxXQUFXLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN2QixNQUFNLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FDWCxPQUFDLENBQUMsTUFBTSxDQUFDO1FB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Q0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVsRCx3QkFBd0I7UUFDeEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQTtRQUNuRCxNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUVsQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25FLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0FBQ0wsQ0FBQyxDQUFBO0FBcEVZLFFBQUEsWUFBWSxnQkFvRXhCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9wZW5BSSBmcm9tICdvcGVuYWknXG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJ1xuaW1wb3J0IHsgem9kUmVzcG9uc2VGb3JtYXQgfSBmcm9tICdvcGVuYWkvaGVscGVycy96b2QnXG5pbXBvcnQgeyBBc3Npc3RhbnRUb29sQ2hvaWNlIH0gZnJvbSAnb3BlbmFpL3Jlc291cmNlcy9iZXRhL3RocmVhZHMvdGhyZWFkcydcbmltcG9ydCB7IENoYXRGb2N1cywgQ2hhdElucHV0LCBDaGF0VHlwZSwgSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeSB9IGZyb20gJy4vQVBJJ1xuaW1wb3J0IHsgY3JlYXRlQ2hhdCB9IGZyb20gJy4vZ3JhcGhxbC9tdXRhdGlvbnMnXG5pbXBvcnQgeyBkZWZhdWx0UHJvdmlkZXIgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLW5vZGUnXG5pbXBvcnQgKiBhcyBhd3M0IGZyb20gJ2F3czQnXG5pbXBvcnQgeyBleHBhbnNpb25Qcm9tcHQsIG5ld3NQcm9tcHQsIHByZUV4cGFuc2lvblByb21wdCwgdGVjaG5pY2FsUHJvbXB0IH0gZnJvbSAnLi9zdG9ja1Byb21wdHMnXG5jb25zdCBhcHBzeW5jVXJsID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19VUkwgYXMgc3RyaW5nXG5jb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5BUFBTWU5DX0FQSV9LRVkgYXMgc3RyaW5nXG5cbmNvbnN0IHJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIHRyYW5zZmVyczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgYW1vdW50OiB6LnN0cmluZygpLFxuICAgICAgICAgICAgZnJvbUFjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgdG9BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBoaWdoTGV2ZWxDYXRlZ29yeTogSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeVxuICAgIHRpbWVmcmFtZTogQnVkZ2V0VGltZWZyYW1lXG4gICAgc3BlbmRpbmdUaHJlc2hvbGQ6IEZsb2F0XG4gICAgY3JlYXRlZEF0OiBTdHJpbmdcbiAgICBzcGVjaWZpY1BheWVlUmVnZXg6IFN0cmluZ1xuICovXG5jb25zdCBjYXRlZ29yaWVzOiBzdHJpbmdbXSA9IE9iamVjdC5rZXlzKEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnkpLmZpbHRlcigoa2V5KSA9PiBpc05hTihOdW1iZXIoa2V5KSkpXG5jb25zdCB0dXBsZVZhbHVlcyA9IGNhdGVnb3JpZXMgYXMgW3N0cmluZywgLi4uc3RyaW5nW11dXG5cbmNvbnN0IHRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25BY3Rpb24gPSB6Lm9iamVjdCh7XG4gICAgZGVzY3JpcHRpb246IHouc3RyaW5nKCksXG4gICAgYnVkZ2V0OiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICB0aW1lZnJhbWU6IHouZW51bShbJ0RBSUxZJywgJ1dFRUtMWScsICdNT05USExZJ10pLFxuICAgICAgICAgICAgc3BlbmRpbmdUaHJlc2hvbGQ6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBoaWdoTGV2ZWxDYXRlZ29yeTogei5lbnVtKHR1cGxlVmFsdWVzKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlRm9ybWF0ID0gei5vYmplY3Qoe1xuICAgIG5ld0NvZGU6IHouc3RyaW5nKCksXG59KVxuXG5jb25zdCBTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQgPSB6Lm9iamVjdCh7XG4gICAgaGlnaExldmVsRGVzY3JpcHRpb25PZklkZWFXaXRob3V0TWVudGlvbmluZ0NvZGU6IHouc3RyaW5nKCksXG4gICAgaW5wdXRLZXlzOiB6LmFycmF5KHoub2JqZWN0KHsgbmFtZTogei5zdHJpbmcoKSwgZGVmYXVsdFZhbHVlOiB6LnN0cmluZygpIH0pKSxcbiAgICB0aXRsZTogei5zdHJpbmcoKSxcbn0pXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlSW50ZXJmYWNlIHtcbiAgICBuZXdDb2RlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VJbnRlcmZhY2Uge1xuICAgIGhpZ2hMZXZlbERlc2NyaXB0aW9uT2ZJZGVhV2l0aG91dE1lbnRpb25pbmdDb2RlOiBzdHJpbmdcbiAgICBpbnB1dEtleXM6IHtcbiAgICAgICAgbmFtZTogc3RyaW5nXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogc3RyaW5nXG4gICAgfVtdXG4gICAgdGl0bGU6IHN0cmluZ1xufVxuXG5jb25zdCBSZWNvbW1lbmRhdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogcmVjb21tZW5kYXRpb25BY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHByaW9yaXR5OiB6LmVudW0oWydIaWdoJywgJ01lZGl1bScsICdMb3cnXSksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogdHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBcbiAqIHR5cGUgR3JhcGhUeXBlIHtcbiAgICBwaWVDaGFydDogU3RyaW5nXG4gICAgYmFyQ2hhcnQ6IFN0cmluZ1xuICAgIGhpc3RvZ3JhbTogU3RyaW5nXG4gICAgdGltZVBsb3Q6IFN0cmluZ1xufVxuICogdHlwZSBQcmVtaXVtQ2hhdFJlc3BvbnNlIHtcbiAgICByZXNwb25zZTogU3RyaW5nXG4gICAgZ3JhcGhzOiBHcmFwaFR5cGVcbiAqL1xuXG5jb25zdCBQcmVtaXVtQ2hhdFJlc3BvbnNlID0gei5vYmplY3Qoe1xuICAgIHJlc3BvbnNlOiB6LnN0cmluZygpLFxufSlcblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlciB7XG4gICAgZnJvbUFjY291bnROYW1lOiBzdHJpbmdcbiAgICB0b0FjY291bnROYW1lOiBzdHJpbmdcbiAgICBhbW91bnQ6IHN0cmluZ1xufVxuaW50ZXJmYWNlIFJlY29tbWVuZGF0aW9uQWN0aW9uIHtcbiAgICB0cmFuc2ZlcnM6IFRyYW5zZmVyW11cbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb21tZW5kYXRpb24ge1xuICAgIGV4cGxhbmF0aW9uOiBzdHJpbmdcbiAgICBhY3Rpb246IFJlY29tbWVuZGF0aW9uQWN0aW9uXG4gICAgdGl0bGU6IHN0cmluZ1xuICAgIHByaW9yaXR5OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IGFwaUNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgIGFwaUtleTogcHJvY2Vzcy5lbnZbJ0dwdFNlY3JldEtleSddISxcbiAgICBkYW5nZXJvdXNseUFsbG93QnJvd3NlcjogZmFsc2UsXG59KVxuXG5jb25zdCBjaGF0ID0gYXBpQ2xpZW50LmNoYXRcblxuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc0Zyb21EYXRhID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChSZWNvbW1lbmRhdGlvbnMsICdyZWNvbW1lbmRhdGlvbnMnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgbWFrZVBlcnBsZXhpdHlDYWxsID0gYXN5bmMgKGJvZHk6IGFueSkgPT4ge1xuICAgIGRlbGV0ZSBib2R5WydyZXNwb25zZV9mb3JtYXQnXVxuICAgIGRlbGV0ZSBib2R5WydzdHJlYW0nXVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLnBlcnBsZXhpdHkuYWkvY2hhdC9jb21wbGV0aW9ucycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBwcm9jZXNzLmVudi5QZXJwbGV4aXR5U2VjcmV0S2V5LFxuICAgICAgICB9IGFzIGFueSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgfSlcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIC8vIExvZyB0aGUgZXJyb3IgcmVzcG9uc2UgZm9yIGRlYnVnZ2luZ1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgUmVzcG9uc2U6JywgZXJyb3JUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFQSSByZXF1ZXN0IGZhaWxlZCB3aXRoIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c306ICR7ZXJyb3JUZXh0fWApXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgSlNPTi4gUmVzcG9uc2Ugd2FzOicsIHJlc3BvbnNlVGV4dClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBUEkgcmV0dXJuZWQgbm9uLUpTT04gcmVzcG9uc2UnKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBsZXRlQ2hhdEZyb21Qcm9tcHQgPSBhc3luYyAoXG4gICAgcHJvbXB0OiBzdHJpbmcsXG4gICAgdHlwZTogQ2hhdEZvY3VzIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICByZXF1aXJlc0xpdmVEYXRhOiBib29sZWFuLFxuICAgIGNoYXRUeXBlOiBDaGF0VHlwZVxuKSA9PiB7XG4gICAgY29uc3QgZG9lc1N0cmVhbVJlcyA9XG4gICAgICAgIGNoYXRUeXBlICE9PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnkgJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnkgJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLlNpbXVsYXRpb25FeHBhbnNpb24gJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvbiAmJlxuICAgICAgICBjaGF0VHlwZSAhPT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvbiAmJlxuICAgICAgICBjaGF0VHlwZSAhPT0gQ2hhdFR5cGUuUmV0cnlDb2RlQnVpbGQgLy8gc3RyZWFtIHRvIGdldCBmYXN0ZXJcbiAgICBjb25zdCBzeXN0ZW1Qcm9tcHQgPVxuICAgICAgICBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsTmV3c1F1ZXJ5XG4gICAgICAgICAgICA/IG5ld3NQcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnlcbiAgICAgICAgICAgID8gdGVjaG5pY2FsUHJvbXB0XG4gICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uXG4gICAgICAgICAgICA/IGV4cGFuc2lvblByb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvblxuICAgICAgICAgICAgPyBwcmVFeHBhbnNpb25Qcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlJldHJ5Q29kZUJ1aWxkXG4gICAgICAgICAgICA/ICdGaXggdGhlIGVycm9yIGZyb20gdGhlIGF0dGFjaGVkIGNvZGUgZmlsZXMsIGFsc28gZml4IGFueSBvdGhlciBwb3RlbnRpYWwgZXJyb3JzLCBkbyBub3QgdXNlIGFueSBiYWNrdGlja3MgaW4geW91ciBweXRob24gY29kZSdcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgID8gYFlvdSBhcmUgYSBwZXJzb25hbCBzcGVuZGluZyBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBZb3UgcHJvdmlkZSBzcGVuZGluZyByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwuYFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuUmVjb21tZW5kQnVkZ2V0XG4gICAgICAgICAgICA/IGBZb3UgYXJlIGEgcGVyc29uYWwgc3BlbmRpbmcgYXNzaXN0YW50IGluIENhbmFkYS4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIFlvdSBwcm92aWRlIGJ1ZGdldCByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwgZm9yIGxvbmd0ZXJtIGdyb3d0aC4gUHJvdmlkZSBhIGJ1ZGdldCBmb3IgZWFjaCByZWxldmFudCBjYXRlZ29yeSBmcm9tIHRoZSBtb250aGx5IHN1bW1hcnlzLmBcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvblxuICAgICAgICAgICAgPyAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCdcbiAgICAgICAgICAgIDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgdHlwZSAmJiB0eXBlICE9PSBDaGF0Rm9jdXMuQWxsID8gdHlwZSA6ICdGaW5hbmNlJ1xuICAgICAgICAgICAgICB9IGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIFlvdSBhcmUgY3VycmVudGx5IGJlaW5nIHVzZWQgaW4gYSBjaGF0IGNvbnRleHQsIHlvdSBtdXN0IHByb3ZpZGUgdmVyeSBjb25jaXNlIHJlcGxpZXMgdG8gbm90IGJvcmUgdGhlIGh1bWFuIHlvdSBhcmUgdGFsa2luZyB0by4gYFxuICAgIGNvbnN0IG1vZGVsID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeSB8fCBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyAnbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lJ1xuICAgICAgICAgICAgOiAnZ3B0LTRvJ1xuICAgIGNvbnN0IG1lc3NhZ2VCb2R5ID0ge1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN5c3RlbVByb21wdCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OlxuICAgICAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gfHwgY2hhdFR5cGUgPT09IENoYXRUeXBlLlJlY29tbWVuZEJ1ZGdldFxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoVHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbiwgJ3JlY29tbWVuZGF0aW9ucycpXG4gICAgICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuR2VuZXJhbFJlY29tbWVuZGF0aW9uXG4gICAgICAgICAgICAgICAgPyB6b2RSZXNwb25zZUZvcm1hdChSZWNvbW1lbmRhdGlvbnMsICdyZWNvbW1lbmRhdGlvbnMnKVxuICAgICAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlNpbXVsYXRpb25FeHBhbnNpb24gfHwgY2hhdFR5cGUgPT09IENoYXRUeXBlLlJldHJ5Q29kZUJ1aWxkXG4gICAgICAgICAgICAgICAgPyB6b2RSZXNwb25zZUZvcm1hdChTaW11bGF0aW9uRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQsICdzaW11bGF0aW9uRXhwYW5zaW9uJylcbiAgICAgICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uUHJlRXhwYW5zaW9uXG4gICAgICAgICAgICAgICAgPyB6b2RSZXNwb25zZUZvcm1hdChTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQsICdzaW11bGF0aW9uUHJlRXhwYW5zaW9uJylcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgbW9kZWwsXG4gICAgICAgIHN0cmVhbTogZG9lc1N0cmVhbVJlcyA/IHRydWUgOiBmYWxzZSxcbiAgICB9XG4gICAgY29uc3Qgc3RyZWFtID0gcmVxdWlyZXNMaXZlRGF0YVxuICAgICAgICA/IGF3YWl0IG1ha2VQZXJwbGV4aXR5Q2FsbChtZXNzYWdlQm9keSlcbiAgICAgICAgOiBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZShtZXNzYWdlQm9keSBhcyBhbnkpXG4gICAgbGV0IG1lc3NhZ2UgPSBbXVxuICAgIGxldCBjb3VudCA9IDBcbiAgICBsZXQgYnVmZmVyOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgZmlyc3RGZXdMaW1pdCA9IDMgLy8gU2VuZCB0aGUgZmlyc3QgMyBjaHVua3MgaW1tZWRpYXRlbHlcbiAgICBjb25zdCBiYXRjaFNpemUgPSAxMDAgLy8gVGhlbiBjb21iaW5lIDEwIGNodW5rcyBhdCBhIHRpbWVcbiAgICBjb25zdCBtZXNzYWdlSWQgPSB1c2VySWQgKyAnIycgKyBEYXRlLm5vdygpLnRvU3RyaW5nKClcblxuICAgIGlmICghcmVxdWlyZXNMaXZlRGF0YSAmJiBkb2VzU3RyZWFtUmVzKSB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3RyZWFtIGFzIGFueSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNodW5rLmNob2ljZXNbMF0/LmRlbHRhPy5jb250ZW50IHx8ICcnXG5cbiAgICAgICAgICAgIC8vIEZvciB0aGUgZmlyc3QgZmV3IGNodW5rcywgc2VuZCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgaWYgKGNvdW50IDwgZmlyc3RGZXdMaW1pdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnR290OicsIGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgZG9lc1N0cmVhbVJlcyAmJiBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb250ZW50LCBmYWxzZSwgbWVzc2FnZUlkKVxuICAgICAgICAgICAgICAgIGNvdW50ID0gY291bnQgKyAxXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCBmZXcsIGFjY3VtdWxhdGUgY2h1bmtzIGluIGEgYnVmZmVyXG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goY29udGVudClcblxuICAgICAgICAgICAgICAgIC8vIE9uY2Ugd2UndmUgYWNjdW11bGF0ZWQgZW5vdWdoIGNodW5rcyAoYmF0Y2hTaXplKSwgc2VuZCB0aGVtIGFzIG9uZSBjb21iaW5lZCBtZXNzYWdlXG4gICAgICAgICAgICAgICAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IGJhdGNoU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE1lc3NhZ2UgPSBidWZmZXIuam9pbignJylcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdTZW5kaW5nIGNvbWJpbmVkIG1lc3NhZ2U6JywgY29tYmluZWRNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICBkb2VzU3RyZWFtUmVzICYmIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbWJpbmVkTWVzc2FnZSwgZmFsc2UsIG1lc3NhZ2VJZClcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbWJpbmVkTWVzc2FnZSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgYnVmZmVyIGFmdGVyIHNlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gW11cbiAgICAgICAgICAgICAgICAgICAgY291bnQgPSBjb3VudCArIDFcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbmNyZW1lbnQgdGhlIGNvdW50ZXIgZXZlbiB3aGVuIGJ1ZmZlcmluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IFtzdHJlYW0/LmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50IHx8ICcnXVxuICAgIH1cbiAgICAvLyBJZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBjaHVua3MgaW4gdGhlIGJ1ZmZlciBhZnRlciB0aGUgbG9vcCBlbmRzLCBzZW5kIHRoZW1cbiAgICBpZiAoYnVmZmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyBmaW5hbCBjb21iaW5lZCBtZXNzYWdlOicsIGNvbWJpbmVkTWVzc2FnZSlcbiAgICAgICAgZG9lc1N0cmVhbVJlcyAmJiBzZW5kQ2hhdFRvVUkodXNlcklkLCBjb3VudC50b1N0cmluZygpLCBjb21iaW5lZE1lc3NhZ2UsIHRydWUsIG1lc3NhZ2VJZClcbiAgICAgICAgbWVzc2FnZS5wdXNoKGNvbWJpbmVkTWVzc2FnZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBkb2VzU3RyZWFtUmVzICYmIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksICcnLCB0cnVlLCBtZXNzYWdlSWQpXG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2Uuam9pbignJylcbn1cblxuZXhwb3J0IGVudW0gSW5mb3JtYXRpb25PcHRpb25zIHtcbiAgICAnSU5WRVNUTUVOVFMnLFxuICAgICdUUkFOU0FDVElPTlMnLFxuICAgICdBQ0NPVU5UUycsXG4gICAgJ01PTlRITFlTVU1NQVJJRVMnLFxufVxuZXhwb3J0IGludGVyZmFjZSBHcHREYXRlUmVzcG9uc2Uge1xuICAgIGRheTogbnVtYmVyXG4gICAgbW9udGg6IG51bWJlclxuICAgIHllYXI6IG51bWJlclxufVxuZXhwb3J0IGludGVyZmFjZSBEYXRhUmFuZ2VSZXNwb25zZSB7XG4gICAgc3RhcnREYXk6IEdwdERhdGVSZXNwb25zZVxuICAgIGVuZERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgaGFzTm9UaW1lQ29uc3RyYWludDogYm9vbGVhblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZm9ybWF0aW9uT3B0aW9uc1Jlc3BvbnNlIHtcbiAgICBvcHRpb25zRm9ySW5mb3JtYXRpb246IEluZm9ybWF0aW9uT3B0aW9uc1tdXG59XG5cbmZ1bmN0aW9uIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKSAvLyBHZXQgdGhlIGN1cnJlbnQgZGF0ZSBhbmQgdGltZVxuXG4gICAgLy8gRXh0cmFjdCB5ZWFyLCBtb250aCwgYW5kIGRheVxuICAgIGNvbnN0IHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKVxuICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKG5vdy5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKSAvLyBNb250aHMgYXJlIDAtYmFzZWQsIHNvIGFkZCAxXG4gICAgY29uc3QgZGF5ID0gU3RyaW5nKG5vdy5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJylcblxuICAgIC8vIFJldHVybiB0aGUgZm9ybWF0dGVkIGRhdGUgYXMgJ1lZWVktTU0tREQnXG4gICAgcmV0dXJuIGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fWBcbn1cblxuZXhwb3J0IGNvbnN0IGdldERhdGVSYW5nZUZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IEFjY2VwdGFibGVWYWx1ZXNGb3JEYXRlUmFuZ2UgPSB6Lm9iamVjdCh7XG4gICAgICAgIHN0YXJ0RGF5OiB6Lm9iamVjdCh7XG4gICAgICAgICAgICBkYXk6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBtb250aDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIHllYXI6IHoubnVtYmVyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBlbmREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGhhc05vVGltZUNvbnN0cmFpbnQ6IHouYm9vbGVhbigpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgJ1RoZSBjdXJyZW50IGRhdGUgaXMgJyArXG4gICAgICAgICAgICAgICAgICAgIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCkgK1xuICAgICAgICAgICAgICAgICAgICAnIEZpbGwgb3V0IHRoZSBiZXN0IHN1aXRlZCBkYXRlIHJhbmdlIGZvciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiAnICtcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LnN1YnN0cmluZygwLCAxMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSwgJ2RhdGVSYW5nZScpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5leHBvcnQgY29uc3QgZ2V0TmVlZGVkSW5mb3JtYXRpb25Gcm9tTW9kZWwgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZyBuZWVkZWQgaW5mb3JtYXRpb24nKVxuICAgIGNvbnN0IEFjY2VwdGFibGVJbmZvcm1hdGlvbk9wdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogei5hcnJheSh6LmVudW0oWydJTlZFU1RNRU5UUycsICdUUkFOU0FDVElPTlMnLCAnQUNDT1VOVFMnXSkpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1doYXQgaW5mb3JtYXRpb24gaXMgYmVzdCBzdWl0ZWQgdG8gYW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgKyBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmNvbnN0IGZsYXR0ZW4gPSAodmFsdWU6IGFueSk6IGFueVtdID0+IHtcbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGZsYXR0ZW4gZWFjaCBlbGVtZW50IHJlY3Vyc2l2ZWx5XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5mbGF0TWFwKGZsYXR0ZW4pIC8vIFVzZSBmbGF0TWFwIHRvIGZsYXR0ZW4gdGhlIGFycmF5IHJlY3Vyc2l2ZWx5XG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3QsIGZsYXR0ZW4gaXRzIHZhbHVlcyByZWN1cnNpdmVseVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXModmFsdWUpKVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LCByZXR1cm4gaXQgYXMgYSBzaW5nbGUtZWxlbWVudCBhcnJheVxuICAgIHJldHVybiBbdmFsdWVdXG59XG5cbmV4cG9ydCBjb25zdCBnZXRUZWNobmljYWxXb3Jkc1doZXJlV2VDYW5Hb0RlZXBlciA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgJ1dlIGFyZSBzdW1tYXJpemluZyBmaW5hbmNpYWwgaW5mb3JtYXRpb24gcmV0dXJuIHRoZSBleGFjdCBwaHJhc2VzIChpbmNsdWRlIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgcHVuY3R1YXRpb24pIHdoZXJlIHdlIGNvdWxkIGRvIGZpbmFuY2lhbCBhbmFseXNpcyBpbnRvIHRoZSB0b3BpYy4gIHJlc3BvbmQgaW4gdGhlIGpzb24gZm9ybWF0IFtwaHJhc2UxLCBwaHJhc2UyXV0nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfSxcbiAgICAgICAgICAgIG1vZGVsOiAnZ3B0LTMuNS10dXJibycsXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGpzb25PYmplY3QgPSBKU09OLnBhcnNlKGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIS5jb250ZW50IHx8ICcnKVxuICAgICAgICBpZiAoanNvbk9iamVjdC5waHJhc2UxIHx8IGpzb25PYmplY3QucGhyYXNlcyB8fCBPYmplY3Qua2V5cyhqc29uT2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKGpzb25PYmplY3QpKVxuICAgICAgICB9IGVsc2UgaWYgKGpzb25PYmplY3QubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihqc29uT2JqZWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBbXVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUFzc2lzdGFudCA9IGFzeW5jICgpID0+XG4gICAgYXBpQ2xpZW50LmJldGEuYXNzaXN0YW50cy5jcmVhdGUoe1xuICAgICAgICBpbnN0cnVjdGlvbnM6XG4gICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gd3JpdGUgYW5kIHJ1biBjb2RlIHRvIGFuc3dlciB0aGUgcXVlc3Rpb24uJyxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IHVwbG9hZEZpbGVUb0Fzc2lzdGFudCA9IGFzeW5jIChmaWxlOiBGaWxlKSA9PiB7XG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zdCBmaWxlUmV0dXJuID0gYXdhaXQgYXBpQ2xpZW50LmZpbGVzLmNyZWF0ZSh7XG4gICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgIHB1cnBvc2U6ICdhc3Npc3RhbnRzJyxcbiAgICB9KVxuICAgIHJldHVybiBmaWxlUmV0dXJuXG59XG5cbmV4cG9ydCBjb25zdCBjb2RlSW50ZXJwZXJ0ZXJGb3JBbmFseXNpcyA9IGFzeW5jIChmaWxlSWRzOiBzdHJpbmdbXSwgYXNzaXN0YW50X2lkOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGhyZWFkID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgYXR0YWNobWVudHM6IGZpbGVJZHMubWFwKChmaWxlSWQpID0+ICh7IGZpbGVfaWQ6IGZpbGVJZCwgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSB9KSksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pXG4gICAgcmV0dXJuIHRocmVhZFxufVxuXG5leHBvcnQgY29uc3QgcnVuVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcsIGFzc2lzdGFudF9pZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcnVuUGFyYW1zID0ge1xuICAgICAgICBhc3Npc3RhbnRfaWQ6IGFzc2lzdGFudF9pZCxcbiAgICAgICAgdG9vbF9jaG9pY2U6IHsgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH0gYXMgQXNzaXN0YW50VG9vbENob2ljZSxcbiAgICB9XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5ydW5zLmNyZWF0ZUFuZFBvbGwodGhyZWFkSWQsIHJ1blBhcmFtcylcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKHN0YXR1cylcbiAgICByZXR1cm4gc3RhdHVzXG59XG5cbmV4cG9ydCBjb25zdCBsaXN0TWVzc2FnZXNGb3JUaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5tZXNzYWdlcy5saXN0KHRocmVhZElkKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2cobWVzc2FnZXMpXG4gICAgcmV0dXJuIG1lc3NhZ2VzXG59XG5cbmV4cG9ydCBjb25zdCBzZW5kQ2hhdFRvVUkgPSBhc3luYyAoXG4gICAgcGs6IHN0cmluZyxcbiAgICBzazogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBpc0xhc3RDaHVuazogYm9vbGVhbixcbiAgICBtZXNzYWdlSWQ6IHN0cmluZ1xuKSA9PiB7XG4gICAgLy8gVE9ETzogZXhwaXJlIHRoZSBjaGF0c1xuICAgIGNvbnN0IGNoYXRJbnB1dDogQ2hhdElucHV0ID0ge1xuICAgICAgICBwazogcGssXG4gICAgICAgIHNrOiBzayxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgdGltZTogRGF0ZS5ub3coKS50b1N0cmluZygpLFxuICAgICAgICBpc0xhc3RDaHVuayxcbiAgICAgICAgbWVzc2FnZUlkLFxuICAgIH1cblxuICAgIC8vIFByZXBhcmUgR3JhcGhRTCByZXF1ZXN0IHBheWxvYWRcbiAgICBjb25zdCBncmFwaHFsRGF0YSA9IHtcbiAgICAgICAgcXVlcnk6IGNyZWF0ZUNoYXQsXG4gICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgY2hhdDogY2hhdElucHV0LFxuICAgICAgICB9LFxuICAgIH1cbiAgICBjb25zdCBwb3N0Qm9keSA9IEpTT04uc3RyaW5naWZ5KGdyYXBocWxEYXRhKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3JlZGVudGlhbHMgPSBhd2FpdCBkZWZhdWx0UHJvdmlkZXIoKSgpXG4gICAgICAgIGNvbnN0IHVyaSA9IG5ldyBVUkwoYXBwc3luY1VybClcbiAgICAgICAgY29uc3QgaHR0cFJlcXVlc3QgPSB7XG4gICAgICAgICAgICBob3N0bmFtZTogdXJpLmhvc3RuYW1lLFxuICAgICAgICAgICAgcGF0aDogdXJpLnBhdGhuYW1lLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgaG9zdDogdXJpLmhvc3RuYW1lLFxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogcG9zdEJvZHksXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgYSBzaWduZXIgb2JqZWN0XG4gICAgICAgIGNvbnN0IHNpZ25lciA9IGF3czQuc2lnbihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZWdpb246ICdjYS1jZW50cmFsLTEnLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdhcHBzeW5jJywgLy8gQXBwU3luYyBpcyB0aGUgc2VydmljZSB3ZSdyZSBpbnRlcmFjdGluZyB3aXRoXG4gICAgICAgICAgICAgICAgcGF0aDogaHR0cFJlcXVlc3QucGF0aCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiBodHRwUmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogaHR0cFJlcXVlc3QubWV0aG9kLFxuICAgICAgICAgICAgICAgIGJvZHk6IGh0dHBSZXF1ZXN0LmJvZHksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFjY2Vzc0tleUlkOiBjcmVkZW50aWFscy5hY2Nlc3NLZXlJZCxcbiAgICAgICAgICAgICAgICBzZWNyZXRBY2Nlc3NLZXk6IGNyZWRlbnRpYWxzLnNlY3JldEFjY2Vzc0tleSxcbiAgICAgICAgICAgICAgICBzZXNzaW9uVG9rZW46IGNyZWRlbnRpYWxzLnNlc3Npb25Ub2tlbixcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuXG4gICAgICAgIC8vIFNpZ24gdGhlIHJlcXVlc3RcbiAgICAgICAgT2JqZWN0LmFzc2lnbihodHRwUmVxdWVzdC5oZWFkZXJzLCBzaWduZXIuaGVhZGVycylcblxuICAgICAgICAvLyBNYWtlIHRoZSBIVFRQIHJlcXVlc3RcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmkuaHJlZiwgaHR0cFJlcXVlc3QpXG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKClcblxuICAgICAgICBjb25zb2xlLmxvZyhgSlNPTiBSZXNwb25zZSA9ICR7SlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMil9YClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBGRVRDSCBFUlJPUjogJHtKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMil9YClcbiAgICB9XG59XG4iXX0=