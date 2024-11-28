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
const completeChatFromPrompt = async (prompt, type, userId, requiresLiveData, chatType, messageHistory) => {
    const doesStreamRes = chatType !== API_1.ChatType.FinancialNewsQuery &&
        chatType !== API_1.ChatType.FinancialAnalysisQuery &&
        chatType !== API_1.ChatType.TransactionRecommendation &&
        chatType !== API_1.ChatType.SimulationExpansion &&
        chatType !== API_1.ChatType.GeneralRecommendation &&
        chatType !== API_1.ChatType.SimulationPreExpansion &&
        chatType !== API_1.ChatType.RetryCodeBuild; // stream to get faster
    const usesHistory = doesStreamRes;
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
            ...(usesHistory
                ? messageHistory
                    ?.map((el) => ({ role: el?.role, content: el?.message?.substring(0, 20000) ?? '' }))
                    ?.slice(0, 5)
                : []),
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
    console.info(messageBody);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUV0RCwrQkFBaUc7QUFDakcsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFDNUIsaURBQWlHO0FBQ2pHLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsR0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLGtDQUE0QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxRyxNQUFNLFdBQVcsR0FBRyxVQUFtQyxDQUFBO0FBRXZELE1BQU0sK0JBQStCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxXQUFXLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN2QixNQUFNLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FDWCxPQUFDLENBQUMsTUFBTSxDQUFDO1FB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Q0FDcEI7WUFDSSxNQUFNLEVBQUUsY0FBYztZQUN0QixPQUFPLEVBQUUsU0FBUyxFQUFFLGdEQUFnRDtZQUNwRSxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUk7WUFDdEIsT0FBTyxFQUFFLFdBQVcsQ0FBQyxPQUFPO1lBQzVCLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUk7U0FDekIsRUFDRDtZQUNJLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVztZQUNwQyxlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWU7WUFDNUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxZQUFZO1NBQ3pDLENBQ0osQ0FBQTtRQUVELG1CQUFtQjtRQUNuQixNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWxELHdCQUF3QjtRQUN4QixNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBQ25ELE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFBO1FBRWxDLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25FLENBQUM7QUFDTCxDQUFDLENBQUE7QUFwRVksUUFBQSxZQUFZLGdCQW9FeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSdcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnXG5pbXBvcnQgeyB6b2RSZXNwb25zZUZvcm1hdCB9IGZyb20gJ29wZW5haS9oZWxwZXJzL3pvZCdcbmltcG9ydCB7IEFzc2lzdGFudFRvb2xDaG9pY2UgfSBmcm9tICdvcGVuYWkvcmVzb3VyY2VzL2JldGEvdGhyZWFkcy90aHJlYWRzJ1xuaW1wb3J0IHsgQ2hhdEZvY3VzLCBDaGF0SGlzdG9yeSwgQ2hhdElucHV0LCBDaGF0VHlwZSwgSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeSB9IGZyb20gJy4vQVBJJ1xuaW1wb3J0IHsgY3JlYXRlQ2hhdCB9IGZyb20gJy4vZ3JhcGhxbC9tdXRhdGlvbnMnXG5pbXBvcnQgeyBkZWZhdWx0UHJvdmlkZXIgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLW5vZGUnXG5pbXBvcnQgKiBhcyBhd3M0IGZyb20gJ2F3czQnXG5pbXBvcnQgeyBleHBhbnNpb25Qcm9tcHQsIG5ld3NQcm9tcHQsIHByZUV4cGFuc2lvblByb21wdCwgdGVjaG5pY2FsUHJvbXB0IH0gZnJvbSAnLi9zdG9ja1Byb21wdHMnXG5jb25zdCBhcHBzeW5jVXJsID0gcHJvY2Vzcy5lbnYuQVBQU1lOQ19VUkwgYXMgc3RyaW5nXG5jb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5BUFBTWU5DX0FQSV9LRVkgYXMgc3RyaW5nXG5cbmNvbnN0IHJlY29tbWVuZGF0aW9uQWN0aW9uID0gei5vYmplY3Qoe1xuICAgIGRlc2NyaXB0aW9uOiB6LnN0cmluZygpLFxuICAgIHRyYW5zZmVyczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgYW1vdW50OiB6LnN0cmluZygpLFxuICAgICAgICAgICAgZnJvbUFjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgdG9BY2NvdW50TmFtZTogei5zdHJpbmcoKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBoaWdoTGV2ZWxDYXRlZ29yeTogSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeVxuICAgIHRpbWVmcmFtZTogQnVkZ2V0VGltZWZyYW1lXG4gICAgc3BlbmRpbmdUaHJlc2hvbGQ6IEZsb2F0XG4gICAgY3JlYXRlZEF0OiBTdHJpbmdcbiAgICBzcGVjaWZpY1BheWVlUmVnZXg6IFN0cmluZ1xuICovXG5jb25zdCBjYXRlZ29yaWVzOiBzdHJpbmdbXSA9IE9iamVjdC5rZXlzKEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnkpLmZpbHRlcigoa2V5KSA9PiBpc05hTihOdW1iZXIoa2V5KSkpXG5jb25zdCB0dXBsZVZhbHVlcyA9IGNhdGVnb3JpZXMgYXMgW3N0cmluZywgLi4uc3RyaW5nW11dXG5cbmNvbnN0IHRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25BY3Rpb24gPSB6Lm9iamVjdCh7XG4gICAgZGVzY3JpcHRpb246IHouc3RyaW5nKCksXG4gICAgYnVkZ2V0OiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICB0aW1lZnJhbWU6IHouZW51bShbJ0RBSUxZJywgJ1dFRUtMWScsICdNT05USExZJ10pLFxuICAgICAgICAgICAgc3BlbmRpbmdUaHJlc2hvbGQ6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBoaWdoTGV2ZWxDYXRlZ29yeTogei5lbnVtKHR1cGxlVmFsdWVzKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuY29uc3QgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlRm9ybWF0ID0gei5vYmplY3Qoe1xuICAgIG5ld0NvZGU6IHouc3RyaW5nKCksXG59KVxuXG5jb25zdCBTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQgPSB6Lm9iamVjdCh7XG4gICAgaGlnaExldmVsRGVzY3JpcHRpb25PZklkZWFXaXRob3V0TWVudGlvbmluZ0NvZGU6IHouc3RyaW5nKCksXG4gICAgaW5wdXRLZXlzOiB6LmFycmF5KHoub2JqZWN0KHsgbmFtZTogei5zdHJpbmcoKSwgZGVmYXVsdFZhbHVlOiB6LnN0cmluZygpIH0pKSxcbiAgICB0aXRsZTogei5zdHJpbmcoKSxcbn0pXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlSW50ZXJmYWNlIHtcbiAgICBuZXdDb2RlOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW11bGF0aW9uUHJlRXhwYW5zaW9uUmVzcG9uc2VJbnRlcmZhY2Uge1xuICAgIGhpZ2hMZXZlbERlc2NyaXB0aW9uT2ZJZGVhV2l0aG91dE1lbnRpb25pbmdDb2RlOiBzdHJpbmdcbiAgICBpbnB1dEtleXM6IHtcbiAgICAgICAgbmFtZTogc3RyaW5nXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogc3RyaW5nXG4gICAgfVtdXG4gICAgdGl0bGU6IHN0cmluZ1xufVxuXG5jb25zdCBSZWNvbW1lbmRhdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogcmVjb21tZW5kYXRpb25BY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHByaW9yaXR5OiB6LmVudW0oWydIaWdoJywgJ01lZGl1bScsICdMb3cnXSksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbmNvbnN0IFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gPSB6Lm9iamVjdCh7XG4gICAgcmVjb21tZW5kYXRpb25zOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBleHBsYW5hdGlvbjogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIGFjdGlvbjogdHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbkFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiB6LnN0cmluZygpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHouZW51bShbJ0hpZ2gnLCAnTWVkaXVtJywgJ0xvdyddKSxcbiAgICAgICAgfSlcbiAgICApLFxufSlcblxuLyoqXG4gKiBcbiAqIHR5cGUgR3JhcGhUeXBlIHtcbiAgICBwaWVDaGFydDogU3RyaW5nXG4gICAgYmFyQ2hhcnQ6IFN0cmluZ1xuICAgIGhpc3RvZ3JhbTogU3RyaW5nXG4gICAgdGltZVBsb3Q6IFN0cmluZ1xufVxuICogdHlwZSBQcmVtaXVtQ2hhdFJlc3BvbnNlIHtcbiAgICByZXNwb25zZTogU3RyaW5nXG4gICAgZ3JhcGhzOiBHcmFwaFR5cGVcbiAqL1xuXG5jb25zdCBQcmVtaXVtQ2hhdFJlc3BvbnNlID0gei5vYmplY3Qoe1xuICAgIHJlc3BvbnNlOiB6LnN0cmluZygpLFxufSlcblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2ZlciB7XG4gICAgZnJvbUFjY291bnROYW1lOiBzdHJpbmdcbiAgICB0b0FjY291bnROYW1lOiBzdHJpbmdcbiAgICBhbW91bnQ6IHN0cmluZ1xufVxuaW50ZXJmYWNlIFJlY29tbWVuZGF0aW9uQWN0aW9uIHtcbiAgICB0cmFuc2ZlcnM6IFRyYW5zZmVyW11cbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb21tZW5kYXRpb24ge1xuICAgIGV4cGxhbmF0aW9uOiBzdHJpbmdcbiAgICBhY3Rpb246IFJlY29tbWVuZGF0aW9uQWN0aW9uXG4gICAgdGl0bGU6IHN0cmluZ1xuICAgIHByaW9yaXR5OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IGFwaUNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgIGFwaUtleTogcHJvY2Vzcy5lbnZbJ0dwdFNlY3JldEtleSddISxcbiAgICBkYW5nZXJvdXNseUFsbG93QnJvd3NlcjogZmFsc2UsXG59KVxuXG5jb25zdCBjaGF0ID0gYXBpQ2xpZW50LmNoYXRcblxuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFJlY29tbWVuZGF0aW9uc0Zyb21EYXRhID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChSZWNvbW1lbmRhdGlvbnMsICdyZWNvbW1lbmRhdGlvbnMnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgbWFrZVBlcnBsZXhpdHlDYWxsID0gYXN5bmMgKGJvZHk6IGFueSkgPT4ge1xuICAgIGRlbGV0ZSBib2R5WydyZXNwb25zZV9mb3JtYXQnXVxuICAgIGRlbGV0ZSBib2R5WydzdHJlYW0nXVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLnBlcnBsZXhpdHkuYWkvY2hhdC9jb21wbGV0aW9ucycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBwcm9jZXNzLmVudi5QZXJwbGV4aXR5U2VjcmV0S2V5LFxuICAgICAgICB9IGFzIGFueSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgfSlcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIC8vIExvZyB0aGUgZXJyb3IgcmVzcG9uc2UgZm9yIGRlYnVnZ2luZ1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgUmVzcG9uc2U6JywgZXJyb3JUZXh0KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFQSSByZXF1ZXN0IGZhaWxlZCB3aXRoIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c306ICR7ZXJyb3JUZXh0fWApXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgSlNPTi4gUmVzcG9uc2Ugd2FzOicsIHJlc3BvbnNlVGV4dClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBUEkgcmV0dXJuZWQgbm9uLUpTT04gcmVzcG9uc2UnKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBsZXRlQ2hhdEZyb21Qcm9tcHQgPSBhc3luYyAoXG4gICAgcHJvbXB0OiBzdHJpbmcsXG4gICAgdHlwZTogQ2hhdEZvY3VzIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICByZXF1aXJlc0xpdmVEYXRhOiBib29sZWFuLFxuICAgIGNoYXRUeXBlOiBDaGF0VHlwZSxcbiAgICBtZXNzYWdlSGlzdG9yeTogKENoYXRIaXN0b3J5IHwgbnVsbClbXVxuKSA9PiB7XG4gICAgY29uc3QgZG9lc1N0cmVhbVJlcyA9XG4gICAgICAgIGNoYXRUeXBlICE9PSBDaGF0VHlwZS5GaW5hbmNpYWxOZXdzUXVlcnkgJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnkgJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24gJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLlNpbXVsYXRpb25FeHBhbnNpb24gJiZcbiAgICAgICAgY2hhdFR5cGUgIT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvbiAmJlxuICAgICAgICBjaGF0VHlwZSAhPT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvbiAmJlxuICAgICAgICBjaGF0VHlwZSAhPT0gQ2hhdFR5cGUuUmV0cnlDb2RlQnVpbGQgLy8gc3RyZWFtIHRvIGdldCBmYXN0ZXJcbiAgICBjb25zdCB1c2VzSGlzdG9yeSA9IGRvZXNTdHJlYW1SZXNcbiAgICBjb25zdCBzeXN0ZW1Qcm9tcHQgPVxuICAgICAgICBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsTmV3c1F1ZXJ5XG4gICAgICAgICAgICA/IG5ld3NQcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbEFuYWx5c2lzUXVlcnlcbiAgICAgICAgICAgID8gdGVjaG5pY2FsUHJvbXB0XG4gICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uXG4gICAgICAgICAgICA/IGV4cGFuc2lvblByb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvblxuICAgICAgICAgICAgPyBwcmVFeHBhbnNpb25Qcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlJldHJ5Q29kZUJ1aWxkXG4gICAgICAgICAgICA/ICdGaXggdGhlIGVycm9yIGZyb20gdGhlIGF0dGFjaGVkIGNvZGUgZmlsZXMsIGFsc28gZml4IGFueSBvdGhlciBwb3RlbnRpYWwgZXJyb3JzLCBkbyBub3QgdXNlIGFueSBiYWNrdGlja3MgaW4geW91ciBweXRob24gY29kZSdcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgID8gYFlvdSBhcmUgYSBwZXJzb25hbCBzcGVuZGluZyBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBZb3UgcHJvdmlkZSBzcGVuZGluZyByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwuYFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuUmVjb21tZW5kQnVkZ2V0XG4gICAgICAgICAgICA/IGBZb3UgYXJlIGEgcGVyc29uYWwgc3BlbmRpbmcgYXNzaXN0YW50IGluIENhbmFkYS4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIFlvdSBwcm92aWRlIGJ1ZGdldCByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwgZm9yIGxvbmd0ZXJtIGdyb3d0aC4gUHJvdmlkZSBhIGJ1ZGdldCBmb3IgZWFjaCByZWxldmFudCBjYXRlZ29yeSBmcm9tIHRoZSBtb250aGx5IHN1bW1hcnlzLmBcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvblxuICAgICAgICAgICAgPyAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gTGVhdmUgdGhlIHRyYW5zZmVyIGluZm9ybWF0aW9uIGVtcHR5IGlmIG5vIHRyYW5zZmVyIGlzIG5lZWRlZCdcbiAgICAgICAgICAgIDogYFlvdSBhcmUgYSBwZXJzb25hbCAke1xuICAgICAgICAgICAgICAgICAgdHlwZSAmJiB0eXBlICE9PSBDaGF0Rm9jdXMuQWxsID8gdHlwZSA6ICdGaW5hbmNlJ1xuICAgICAgICAgICAgICB9IGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIFlvdSBhcmUgY3VycmVudGx5IGJlaW5nIHVzZWQgaW4gYSBjaGF0IGNvbnRleHQsIHlvdSBtdXN0IHByb3ZpZGUgdmVyeSBjb25jaXNlIHJlcGxpZXMgdG8gbm90IGJvcmUgdGhlIGh1bWFuIHlvdSBhcmUgdGFsa2luZyB0by4gYFxuICAgIGNvbnN0IG1vZGVsID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeSB8fCBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyAnbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lJ1xuICAgICAgICAgICAgOiAnZ3B0LTRvJ1xuICAgIGNvbnN0IG1lc3NhZ2VCb2R5ID0ge1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN5c3RlbVByb21wdCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAuLi4odXNlc0hpc3RvcnlcbiAgICAgICAgICAgICAgICA/IG1lc3NhZ2VIaXN0b3J5XG4gICAgICAgICAgICAgICAgICAgICAgPy5tYXAoKGVsKSA9PiAoeyByb2xlOiBlbD8ucm9sZSwgY29udGVudDogZWw/Lm1lc3NhZ2U/LnN1YnN0cmluZygwLCAyMDAwMCkgPz8gJycgfSkpXG4gICAgICAgICAgICAgICAgICAgICAgPy5zbGljZSgwLCA1KVxuICAgICAgICAgICAgICAgIDogW10pLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQuc3Vic3RyaW5nKDAsIDIwMDAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDpcbiAgICAgICAgICAgIGNoYXRUeXBlID09PSBDaGF0VHlwZS5UcmFuc2FjdGlvblJlY29tbWVuZGF0aW9uIHx8IGNoYXRUeXBlID09PSBDaGF0VHlwZS5SZWNvbW1lbmRCdWRnZXRcbiAgICAgICAgICAgICAgICA/IHpvZFJlc3BvbnNlRm9ybWF0KFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24sICdyZWNvbW1lbmRhdGlvbnMnKVxuICAgICAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvblxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoUmVjb21tZW5kYXRpb25zLCAncmVjb21tZW5kYXRpb25zJylcbiAgICAgICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uIHx8IGNoYXRUeXBlID09PSBDaGF0VHlwZS5SZXRyeUNvZGVCdWlsZFxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlRm9ybWF0LCAnc2ltdWxhdGlvbkV4cGFuc2lvbicpXG4gICAgICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuU2ltdWxhdGlvblByZUV4cGFuc2lvblxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoU2ltdWxhdGlvblByZUV4cGFuc2lvblJlc3BvbnNlRm9ybWF0LCAnc2ltdWxhdGlvblByZUV4cGFuc2lvbicpXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgIG1vZGVsLFxuICAgICAgICBzdHJlYW06IGRvZXNTdHJlYW1SZXMgPyB0cnVlIDogZmFsc2UsXG4gICAgfVxuICAgIGNvbnNvbGUuaW5mbyhtZXNzYWdlQm9keSlcbiAgICBjb25zdCBzdHJlYW0gPSByZXF1aXJlc0xpdmVEYXRhXG4gICAgICAgID8gYXdhaXQgbWFrZVBlcnBsZXhpdHlDYWxsKG1lc3NhZ2VCb2R5KVxuICAgICAgICA6IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKG1lc3NhZ2VCb2R5IGFzIGFueSlcbiAgICBsZXQgbWVzc2FnZSA9IFtdXG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGxldCBidWZmZXI6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBmaXJzdEZld0xpbWl0ID0gMyAvLyBTZW5kIHRoZSBmaXJzdCAzIGNodW5rcyBpbW1lZGlhdGVseVxuICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDEwMCAvLyBUaGVuIGNvbWJpbmUgMTAgY2h1bmtzIGF0IGEgdGltZVxuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHVzZXJJZCArICcjJyArIERhdGUubm93KCkudG9TdHJpbmcoKVxuXG4gICAgaWYgKCFyZXF1aXJlc0xpdmVEYXRhICYmIGRvZXNTdHJlYW1SZXMpIHtcbiAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBzdHJlYW0gYXMgYW55KSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gY2h1bmsuY2hvaWNlc1swXT8uZGVsdGE/LmNvbnRlbnQgfHwgJydcblxuICAgICAgICAgICAgLy8gRm9yIHRoZSBmaXJzdCBmZXcgY2h1bmtzLCBzZW5kIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY291bnQgPCBmaXJzdEZld0xpbWl0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdHb3Q6JywgY29udGVudClcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnB1c2goY29udGVudClcbiAgICAgICAgICAgICAgICBkb2VzU3RyZWFtUmVzICYmIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbnRlbnQsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgY291bnQgPSBjb3VudCArIDFcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIGZpcnN0IGZldywgYWNjdW11bGF0ZSBjaHVua3MgaW4gYSBidWZmZXJcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaChjb250ZW50KVxuXG4gICAgICAgICAgICAgICAgLy8gT25jZSB3ZSd2ZSBhY2N1bXVsYXRlZCBlbm91Z2ggY2h1bmtzIChiYXRjaFNpemUpLCBzZW5kIHRoZW0gYXMgb25lIGNvbWJpbmVkIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gYmF0Y2hTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVkTWVzc2FnZSA9IGJ1ZmZlci5qb2luKCcnKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1NlbmRpbmcgY29tYmluZWQgbWVzc2FnZTonLCBjb21iaW5lZE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgIGRvZXNTdHJlYW1SZXMgJiYgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29tYmluZWRNZXNzYWdlLCBmYWxzZSwgbWVzc2FnZUlkKVxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnB1c2goY29tYmluZWRNZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBidWZmZXIgYWZ0ZXIgc2VuZGluZ1xuICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBbXVxuICAgICAgICAgICAgICAgICAgICBjb3VudCA9IGNvdW50ICsgMVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEluY3JlbWVudCB0aGUgY291bnRlciBldmVuIHdoZW4gYnVmZmVyaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gW3N0cmVhbT8uY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQgfHwgJyddXG4gICAgfVxuICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nIGNodW5rcyBpbiB0aGUgYnVmZmVyIGFmdGVyIHRoZSBsb29wIGVuZHMsIHNlbmQgdGhlbVxuICAgIGlmIChidWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBjb21iaW5lZE1lc3NhZ2UgPSBidWZmZXIuam9pbignJylcbiAgICAgICAgY29uc29sZS5pbmZvKCdTZW5kaW5nIGZpbmFsIGNvbWJpbmVkIG1lc3NhZ2U6JywgY29tYmluZWRNZXNzYWdlKVxuICAgICAgICBkb2VzU3RyZWFtUmVzICYmIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbWJpbmVkTWVzc2FnZSwgdHJ1ZSwgbWVzc2FnZUlkKVxuICAgICAgICBtZXNzYWdlLnB1c2goY29tYmluZWRNZXNzYWdlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRvZXNTdHJlYW1SZXMgJiYgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgJycsIHRydWUsIG1lc3NhZ2VJZClcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzc2FnZS5qb2luKCcnKVxufVxuXG5leHBvcnQgZW51bSBJbmZvcm1hdGlvbk9wdGlvbnMge1xuICAgICdJTlZFU1RNRU5UUycsXG4gICAgJ1RSQU5TQUNUSU9OUycsXG4gICAgJ0FDQ09VTlRTJyxcbiAgICAnTU9OVEhMWVNVTU1BUklFUycsXG59XG5leHBvcnQgaW50ZXJmYWNlIEdwdERhdGVSZXNwb25zZSB7XG4gICAgZGF5OiBudW1iZXJcbiAgICBtb250aDogbnVtYmVyXG4gICAgeWVhcjogbnVtYmVyXG59XG5leHBvcnQgaW50ZXJmYWNlIERhdGFSYW5nZVJlc3BvbnNlIHtcbiAgICBzdGFydERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgZW5kRGF5OiBHcHREYXRlUmVzcG9uc2VcbiAgICBoYXNOb1RpbWVDb25zdHJhaW50OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5mb3JtYXRpb25PcHRpb25zUmVzcG9uc2Uge1xuICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogSW5mb3JtYXRpb25PcHRpb25zW11cbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybWF0dGVkQ3VycmVudERhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpIC8vIEdldCB0aGUgY3VycmVudCBkYXRlIGFuZCB0aW1lXG5cbiAgICAvLyBFeHRyYWN0IHllYXIsIG1vbnRoLCBhbmQgZGF5XG4gICAgY29uc3QgeWVhciA9IG5vdy5nZXRGdWxsWWVhcigpXG4gICAgY29uc3QgbW9udGggPSBTdHJpbmcobm93LmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpIC8vIE1vbnRocyBhcmUgMC1iYXNlZCwgc28gYWRkIDFcbiAgICBjb25zdCBkYXkgPSBTdHJpbmcobm93LmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKVxuXG4gICAgLy8gUmV0dXJuIHRoZSBmb3JtYXR0ZWQgZGF0ZSBhcyAnWVlZWS1NTS1ERCdcbiAgICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9YFxufVxuXG5leHBvcnQgY29uc3QgZ2V0RGF0ZVJhbmdlRnJvbU1vZGVsID0gYXN5bmMgKHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSA9IHoub2JqZWN0KHtcbiAgICAgICAgc3RhcnREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGVuZERheTogei5vYmplY3Qoe1xuICAgICAgICAgICAgZGF5OiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgbW9udGg6IHoubnVtYmVyKCksXG4gICAgICAgICAgICB5ZWFyOiB6Lm51bWJlcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgaGFzTm9UaW1lQ29uc3RyYWludDogei5ib29sZWFuKCksXG4gICAgfSlcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAnVGhlIGN1cnJlbnQgZGF0ZSBpcyAnICtcbiAgICAgICAgICAgICAgICAgICAgZ2V0Rm9ybWF0dGVkQ3VycmVudERhdGUoKSArXG4gICAgICAgICAgICAgICAgICAgICcgRmlsbCBvdXQgdGhlIGJlc3Qgc3VpdGVkIGRhdGUgcmFuZ2UgZm9yIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgK1xuICAgICAgICAgICAgICAgICAgICBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlVmFsdWVzRm9yRGF0ZVJhbmdlLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmV4cG9ydCBjb25zdCBnZXROZWVkZWRJbmZvcm1hdGlvbkZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIG5lZWRlZCBpbmZvcm1hdGlvbicpXG4gICAgY29uc3QgQWNjZXB0YWJsZUluZm9ybWF0aW9uT3B0aW9ucyA9IHoub2JqZWN0KHtcbiAgICAgICAgb3B0aW9uc0ZvckluZm9ybWF0aW9uOiB6LmFycmF5KHouZW51bShbJ0lOVkVTVE1FTlRTJywgJ1RSQU5TQUNUSU9OUycsICdBQ0NPVU5UUyddKSksXG4gICAgfSlcbiAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnV2hhdCBpbmZvcm1hdGlvbiBpcyBiZXN0IHN1aXRlZCB0byBhbnN3ZXIgdGhlIGZvbGxvd2luZyBxdWVyeTogJyArIHByb21wdC5zdWJzdHJpbmcoMCwgMTAwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHpvZFJlc3BvbnNlRm9ybWF0KEFjY2VwdGFibGVJbmZvcm1hdGlvbk9wdGlvbnMsICdkYXRlUmFuZ2UnKSxcbiAgICB9KVxuICAgIHJldHVybiBjaGF0T3V0cHV0LmNob2ljZXNbMF0ubWVzc2FnZSFcbn1cblxuY29uc3QgZmxhdHRlbiA9ICh2YWx1ZTogYW55KTogYW55W10gPT4ge1xuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgZmxhdHRlbiBlYWNoIGVsZW1lbnQgcmVjdXJzaXZlbHlcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLmZsYXRNYXAoZmxhdHRlbikgLy8gVXNlIGZsYXRNYXAgdG8gZmxhdHRlbiB0aGUgYXJyYXkgcmVjdXJzaXZlbHlcbiAgICB9XG4gICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCwgZmxhdHRlbiBpdHMgdmFsdWVzIHJlY3Vyc2l2ZWx5XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZsYXR0ZW4oT2JqZWN0LnZhbHVlcyh2YWx1ZSkpXG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhbiBvYmplY3QsIHJldHVybiBpdCBhcyBhIHNpbmdsZS1lbGVtZW50IGFycmF5XG4gICAgcmV0dXJuIFt2YWx1ZV1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFRlY2huaWNhbFdvcmRzV2hlcmVXZUNhbkdvRGVlcGVyID0gYXN5bmMgKHByb21wdDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAnV2UgYXJlIHN1bW1hcml6aW5nIGZpbmFuY2lhbCBpbmZvcm1hdGlvbiByZXR1cm4gdGhlIGV4YWN0IHBocmFzZXMgKGluY2x1ZGUgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBwdW5jdHVhdGlvbikgd2hlcmUgd2UgY291bGQgZG8gZmluYW5jaWFsIGFuYWx5c2lzIGludG8gdGhlIHRvcGljLiAgcmVzcG9uZCBpbiB0aGUganNvbiBmb3JtYXQgW3BocmFzZTEsIHBocmFzZTJdXScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LnN1YnN0cmluZygwLCAyMDAwMCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogJ2pzb25fb2JqZWN0JyB9LFxuICAgICAgICAgICAgbW9kZWw6ICdncHQtMy41LXR1cmJvJyxcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QganNvbk9iamVjdCA9IEpTT04ucGFyc2UoY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhLmNvbnRlbnQgfHwgJycpXG4gICAgICAgIGlmIChqc29uT2JqZWN0LnBocmFzZTEgfHwganNvbk9iamVjdC5waHJhc2VzIHx8IE9iamVjdC5rZXlzKGpzb25PYmplY3QpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXMoanNvbk9iamVjdCkpXG4gICAgICAgIH0gZWxzZSBpZiAoanNvbk9iamVjdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuKGpzb25PYmplY3QpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQXNzaXN0YW50ID0gYXN5bmMgKCkgPT5cbiAgICBhcGlDbGllbnQuYmV0YS5hc3Npc3RhbnRzLmNyZWF0ZSh7XG4gICAgICAgIGluc3RydWN0aW9uczpcbiAgICAgICAgICAgICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiB3cml0ZSBhbmQgcnVuIGNvZGUgdG8gYW5zd2VyIHRoZSBxdWVzdGlvbi4nLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgdXBsb2FkRmlsZVRvQXNzaXN0YW50ID0gYXN5bmMgKGZpbGU6IEZpbGUpID0+IHtcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnN0IGZpbGVSZXR1cm4gPSBhd2FpdCBhcGlDbGllbnQuZmlsZXMuY3JlYXRlKHtcbiAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgcHVycG9zZTogJ2Fzc2lzdGFudHMnLFxuICAgIH0pXG4gICAgcmV0dXJuIGZpbGVSZXR1cm5cbn1cblxuZXhwb3J0IGNvbnN0IGNvZGVJbnRlcnBlcnRlckZvckFuYWx5c2lzID0gYXN5bmMgKGZpbGVJZHM6IHN0cmluZ1tdLCBhc3Npc3RhbnRfaWQ6IHN0cmluZywgcHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0aHJlYWQgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdCxcbiAgICAgICAgICAgICAgICBhdHRhY2htZW50czogZmlsZUlkcy5tYXAoKGZpbGVJZCkgPT4gKHsgZmlsZV9pZDogZmlsZUlkLCB0b29sczogW3sgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH1dIH0pKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSlcbiAgICByZXR1cm4gdGhyZWFkXG59XG5cbmV4cG9ydCBjb25zdCBydW5UaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZywgYXNzaXN0YW50X2lkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBydW5QYXJhbXMgPSB7XG4gICAgICAgIGFzc2lzdGFudF9pZDogYXNzaXN0YW50X2lkLFxuICAgICAgICB0b29sX2Nob2ljZTogeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfSBhcyBBc3Npc3RhbnRUb29sQ2hvaWNlLFxuICAgIH1cbiAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLnJ1bnMuY3JlYXRlQW5kUG9sbCh0aHJlYWRJZCwgcnVuUGFyYW1zKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2coc3RhdHVzKVxuICAgIHJldHVybiBzdGF0dXNcbn1cblxuZXhwb3J0IGNvbnN0IGxpc3RNZXNzYWdlc0ZvclRocmVhZCA9IGFzeW5jICh0aHJlYWRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBhcGlDbGllbnQuYmV0YS50aHJlYWRzLm1lc3NhZ2VzLmxpc3QodGhyZWFkSWQpXG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlcylcbiAgICByZXR1cm4gbWVzc2FnZXNcbn1cblxuZXhwb3J0IGNvbnN0IHNlbmRDaGF0VG9VSSA9IGFzeW5jIChcbiAgICBwazogc3RyaW5nLFxuICAgIHNrOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGlzTGFzdENodW5rOiBib29sZWFuLFxuICAgIG1lc3NhZ2VJZDogc3RyaW5nXG4pID0+IHtcbiAgICAvLyBUT0RPOiBleHBpcmUgdGhlIGNoYXRzXG4gICAgY29uc3QgY2hhdElucHV0OiBDaGF0SW5wdXQgPSB7XG4gICAgICAgIHBrOiBwayxcbiAgICAgICAgc2s6IHNrLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB0aW1lOiBEYXRlLm5vdygpLnRvU3RyaW5nKCksXG4gICAgICAgIGlzTGFzdENodW5rLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgfVxuXG4gICAgLy8gUHJlcGFyZSBHcmFwaFFMIHJlcXVlc3QgcGF5bG9hZFxuICAgIGNvbnN0IGdyYXBocWxEYXRhID0ge1xuICAgICAgICBxdWVyeTogY3JlYXRlQ2hhdCxcbiAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBjaGF0OiBjaGF0SW5wdXQsXG4gICAgICAgIH0sXG4gICAgfVxuICAgIGNvbnN0IHBvc3RCb2R5ID0gSlNPTi5zdHJpbmdpZnkoZ3JhcGhxbERhdGEpXG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjcmVkZW50aWFscyA9IGF3YWl0IGRlZmF1bHRQcm92aWRlcigpKClcbiAgICAgICAgY29uc3QgdXJpID0gbmV3IFVSTChhcHBzeW5jVXJsKVxuICAgICAgICBjb25zdCBodHRwUmVxdWVzdCA9IHtcbiAgICAgICAgICAgIGhvc3RuYW1lOiB1cmkuaG9zdG5hbWUsXG4gICAgICAgICAgICBwYXRoOiB1cmkucGF0aG5hbWUsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBob3N0OiB1cmkuaG9zdG5hbWUsXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBwb3N0Qm9keSxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBhIHNpZ25lciBvYmplY3RcbiAgICAgICAgY29uc3Qgc2lnbmVyID0gYXdzNC5zaWduKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlZ2lvbjogJ2NhLWNlbnRyYWwtMScsXG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2FwcHN5bmMnLCAvLyBBcHBTeW5jIGlzIHRoZSBzZXJ2aWNlIHdlJ3JlIGludGVyYWN0aW5nIHdpdGhcbiAgICAgICAgICAgICAgICBwYXRoOiBodHRwUmVxdWVzdC5wYXRoLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IGh0dHBSZXF1ZXN0LmhlYWRlcnMsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBodHRwUmVxdWVzdC5tZXRob2QsXG4gICAgICAgICAgICAgICAgYm9keTogaHR0cFJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYWNjZXNzS2V5SWQ6IGNyZWRlbnRpYWxzLmFjY2Vzc0tleUlkLFxuICAgICAgICAgICAgICAgIHNlY3JldEFjY2Vzc0tleTogY3JlZGVudGlhbHMuc2VjcmV0QWNjZXNzS2V5LFxuICAgICAgICAgICAgICAgIHNlc3Npb25Ub2tlbjogY3JlZGVudGlhbHMuc2Vzc2lvblRva2VuLFxuICAgICAgICAgICAgfVxuICAgICAgICApXG5cbiAgICAgICAgLy8gU2lnbiB0aGUgcmVxdWVzdFxuICAgICAgICBPYmplY3QuYXNzaWduKGh0dHBSZXF1ZXN0LmhlYWRlcnMsIHNpZ25lci5oZWFkZXJzKVxuXG4gICAgICAgIC8vIE1ha2UgdGhlIEhUVFAgcmVxdWVzdFxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVyaS5ocmVmLCBodHRwUmVxdWVzdClcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBKU09OIFJlc3BvbnNlID0gJHtKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKX1gKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZFVENIIEVSUk9SOiAke0pTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKX1gKVxuICAgIH1cbn1cbiJdfQ==