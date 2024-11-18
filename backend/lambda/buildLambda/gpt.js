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
    highLevelDescriptionOfIdeaWithoutMentioningCode: zod_1.z.string(),
    newCode: zod_1.z.string(),
    inputKeys: zod_1.z.array(zod_1.z.string()),
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
            : chatType === API_1.ChatType.SimulationExpansion
                ? stockPrompts_1.expansionPrompt
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
                : chatType === API_1.ChatType.SimulationExpansion
                    ? (0, zod_2.zodResponseFormat)(SimulationExpansionResponseFormat, 'simulationExpansion')
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3B0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMkI7QUFDM0IsNkJBQXVCO0FBQ3ZCLDRDQUFzRDtBQUV0RCwrQkFBb0Y7QUFDcEYsbURBQWdEO0FBQ2hELGdGQUFtRTtBQUNuRSw2QkFBNEI7QUFDNUIsaURBQTZFO0FBQzdFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBcUIsQ0FBQTtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQXlCLENBQUE7QUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUNkLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDTCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUNsQixlQUFlLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtRQUMzQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtLQUM1QixDQUFDLENBQ0w7Q0FDSixDQUFDLENBQUE7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsR0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLGtDQUE0QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxRyxNQUFNLFdBQVcsR0FBRyxVQUFtQyxDQUFBO0FBRXZELE1BQU0sK0JBQStCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxXQUFXLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN2QixNQUFNLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FDWCxPQUFDLENBQUMsTUFBTSxDQUFDO1FB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Q0FDSixDQUFBO1FBRUQsbUJBQW1CO1FBQ25CLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFbEQsd0JBQXdCO1FBQ3hCLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUE7UUFDbkQsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUE7UUFFbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbkUsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQXBFWSxRQUFBLFlBQVksZ0JBb0V4QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSAnb3BlbmFpJ1xuaW1wb3J0IHsgeiB9IGZyb20gJ3pvZCdcbmltcG9ydCB7IHpvZFJlc3BvbnNlRm9ybWF0IH0gZnJvbSAnb3BlbmFpL2hlbHBlcnMvem9kJ1xuaW1wb3J0IHsgQXNzaXN0YW50VG9vbENob2ljZSB9IGZyb20gJ29wZW5haS9yZXNvdXJjZXMvYmV0YS90aHJlYWRzL3RocmVhZHMnXG5pbXBvcnQgeyBDaGF0Rm9jdXMsIENoYXRJbnB1dCwgQ2hhdFR5cGUsIEhpZ2hMZXZlbFRyYW5zYWN0aW9uQ2F0ZWdvcnkgfSBmcm9tICcuL0FQSSdcbmltcG9ydCB7IGNyZWF0ZUNoYXQgfSBmcm9tICcuL2dyYXBocWwvbXV0YXRpb25zJ1xuaW1wb3J0IHsgZGVmYXVsdFByb3ZpZGVyIH0gZnJvbSAnQGF3cy1zZGsvY3JlZGVudGlhbC1wcm92aWRlci1ub2RlJ1xuaW1wb3J0ICogYXMgYXdzNCBmcm9tICdhd3M0J1xuaW1wb3J0IHsgZXhwYW5zaW9uUHJvbXB0LCBuZXdzUHJvbXB0LCB0ZWNobmljYWxQcm9tcHQgfSBmcm9tICcuL3N0b2NrUHJvbXB0cydcbmNvbnN0IGFwcHN5bmNVcmwgPSBwcm9jZXNzLmVudi5BUFBTWU5DX1VSTCBhcyBzdHJpbmdcbmNvbnN0IGFwaUtleSA9IHByb2Nlc3MuZW52LkFQUFNZTkNfQVBJX0tFWSBhcyBzdHJpbmdcblxuY29uc3QgcmVjb21tZW5kYXRpb25BY3Rpb24gPSB6Lm9iamVjdCh7XG4gICAgZGVzY3JpcHRpb246IHouc3RyaW5nKCksXG4gICAgdHJhbnNmZXJzOiB6LmFycmF5KFxuICAgICAgICB6Lm9iamVjdCh7XG4gICAgICAgICAgICBhbW91bnQ6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBmcm9tQWNjb3VudE5hbWU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICB0b0FjY291bnROYW1lOiB6LnN0cmluZygpLFxuICAgICAgICB9KVxuICAgICksXG59KVxuXG4vKipcbiAqIGhpZ2hMZXZlbENhdGVnb3J5OiBIaWdoTGV2ZWxUcmFuc2FjdGlvbkNhdGVnb3J5XG4gICAgdGltZWZyYW1lOiBCdWRnZXRUaW1lZnJhbWVcbiAgICBzcGVuZGluZ1RocmVzaG9sZDogRmxvYXRcbiAgICBjcmVhdGVkQXQ6IFN0cmluZ1xuICAgIHNwZWNpZmljUGF5ZWVSZWdleDogU3RyaW5nXG4gKi9cbmNvbnN0IGNhdGVnb3JpZXM6IHN0cmluZ1tdID0gT2JqZWN0LmtleXMoSGlnaExldmVsVHJhbnNhY3Rpb25DYXRlZ29yeSkuZmlsdGVyKChrZXkpID0+IGlzTmFOKE51bWJlcihrZXkpKSlcbmNvbnN0IHR1cGxlVmFsdWVzID0gY2F0ZWdvcmllcyBhcyBbc3RyaW5nLCAuLi5zdHJpbmdbXV1cblxuY29uc3QgdHJhbnNhY3Rpb25SZWNvbW1lbmRhdGlvbkFjdGlvbiA9IHoub2JqZWN0KHtcbiAgICBkZXNjcmlwdGlvbjogei5zdHJpbmcoKSxcbiAgICBidWRnZXQ6IHouYXJyYXkoXG4gICAgICAgIHoub2JqZWN0KHtcbiAgICAgICAgICAgIHRpbWVmcmFtZTogei5lbnVtKFsnREFJTFknLCAnV0VFS0xZJywgJ01PTlRITFknXSksXG4gICAgICAgICAgICBzcGVuZGluZ1RocmVzaG9sZDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIGhpZ2hMZXZlbENhdGVnb3J5OiB6LmVudW0odHVwbGVWYWx1ZXMpLFxuICAgICAgICB9KVxuICAgICksXG59KVxuXG5jb25zdCBTaW11bGF0aW9uRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQgPSB6Lm9iamVjdCh7XG4gICAgaGlnaExldmVsRGVzY3JpcHRpb25PZklkZWFXaXRob3V0TWVudGlvbmluZ0NvZGU6IHouc3RyaW5nKCksXG4gICAgbmV3Q29kZTogei5zdHJpbmcoKSxcbiAgICBpbnB1dEtleXM6IHouYXJyYXkoei5zdHJpbmcoKSksXG59KVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpbXVsYXRpb25FeHBhbnNpb25SZXNwb25zZUludGVyZmFjZSB7XG4gICAgaGlnaExldmVsRGVzY3JpcHRpb25PZklkZWFXaXRob3V0TWVudGlvbmluZ0NvZGU6IHN0cmluZ1xuICAgIG5ld0NvZGU6IHN0cmluZ1xuICAgIGlucHV0S2V5czogc3RyaW5nW11cbn1cblxuY29uc3QgUmVjb21tZW5kYXRpb25zID0gei5vYmplY3Qoe1xuICAgIHJlY29tbWVuZGF0aW9uczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgZXhwbGFuYXRpb246IHouc3RyaW5nKCksXG4gICAgICAgICAgICBhY3Rpb246IHJlY29tbWVuZGF0aW9uQWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IHouc3RyaW5nKCksXG4gICAgICAgICAgICBwcmlvcml0eTogei5lbnVtKFsnSGlnaCcsICdNZWRpdW0nLCAnTG93J10pLFxuICAgICAgICB9KVxuICAgICksXG59KVxuXG5jb25zdCBUcmFuc2FjdGlvblJlY29tbWVuZGF0aW9uID0gei5vYmplY3Qoe1xuICAgIHJlY29tbWVuZGF0aW9uczogei5hcnJheShcbiAgICAgICAgei5vYmplY3Qoe1xuICAgICAgICAgICAgZXhwbGFuYXRpb246IHouc3RyaW5nKCksXG4gICAgICAgICAgICBhY3Rpb246IHRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25BY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogei5zdHJpbmcoKSxcbiAgICAgICAgICAgIHByaW9yaXR5OiB6LmVudW0oWydIaWdoJywgJ01lZGl1bScsICdMb3cnXSksXG4gICAgICAgIH0pXG4gICAgKSxcbn0pXG5cbi8qKlxuICogXG4gKiB0eXBlIEdyYXBoVHlwZSB7XG4gICAgcGllQ2hhcnQ6IFN0cmluZ1xuICAgIGJhckNoYXJ0OiBTdHJpbmdcbiAgICBoaXN0b2dyYW06IFN0cmluZ1xuICAgIHRpbWVQbG90OiBTdHJpbmdcbn1cbiAqIHR5cGUgUHJlbWl1bUNoYXRSZXNwb25zZSB7XG4gICAgcmVzcG9uc2U6IFN0cmluZ1xuICAgIGdyYXBoczogR3JhcGhUeXBlXG4gKi9cblxuY29uc3QgUHJlbWl1bUNoYXRSZXNwb25zZSA9IHoub2JqZWN0KHtcbiAgICByZXNwb25zZTogei5zdHJpbmcoKSxcbn0pXG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNmZXIge1xuICAgIGZyb21BY2NvdW50TmFtZTogc3RyaW5nXG4gICAgdG9BY2NvdW50TmFtZTogc3RyaW5nXG4gICAgYW1vdW50OiBzdHJpbmdcbn1cbmludGVyZmFjZSBSZWNvbW1lbmRhdGlvbkFjdGlvbiB7XG4gICAgdHJhbnNmZXJzOiBUcmFuc2ZlcltdXG4gICAgZGVzY3JpcHRpb246IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlY29tbWVuZGF0aW9uIHtcbiAgICBleHBsYW5hdGlvbjogc3RyaW5nXG4gICAgYWN0aW9uOiBSZWNvbW1lbmRhdGlvbkFjdGlvblxuICAgIHRpdGxlOiBzdHJpbmdcbiAgICBwcmlvcml0eTogbnVtYmVyXG59XG5cbmV4cG9ydCBjb25zdCBhcGlDbGllbnQgPSBuZXcgT3BlbkFJKHtcbiAgICBhcGlLZXk6IHByb2Nlc3MuZW52WydHcHRTZWNyZXRLZXknXSEsXG4gICAgZGFuZ2Vyb3VzbHlBbGxvd0Jyb3dzZXI6IGZhbHNlLFxufSlcblxuY29uc3QgY2hhdCA9IGFwaUNsaWVudC5jaGF0XG5cbmV4cG9ydCBjb25zdCBnZXRGaW5hbmNpYWxSZWNvbW1lbmRhdGlvbnNGcm9tRGF0YSA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGNoYXRPdXRwdXQgPSBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgJ1lvdSBhcmUgYSBwZXJzb25hbCBmaW5hbmNlIGFzc2lzdGFudC4gWW91IGxldmVyYWdlIGRldGFpbGVkIGtub3dlbGRnZSBvZiBqdXJpc2RpY3Rpb25hbCB0YXggbGF3cyBhbmQgZmluYW5jaWFsIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzIHRvIGd1aWRlIHVzIHRvIG1ha2UgYmV0dGVyIGZpbmFuY2lhbCBkZWNpc2lvbnMuIExlYXZlIHRoZSB0cmFuc2ZlciBpbmZvcm1hdGlvbiBlbXB0eSBpZiBubyB0cmFuc2ZlciBpcyBuZWVkZWQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogcHJvbXB0LnN1YnN0cmluZygwLCAyMDAwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00bycsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoUmVjb21tZW5kYXRpb25zLCAncmVjb21tZW5kYXRpb25zJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmNvbnN0IG1ha2VQZXJwbGV4aXR5Q2FsbCA9IGFzeW5jIChib2R5OiBhbnkpID0+IHtcbiAgICBkZWxldGUgYm9keVsncmVzcG9uc2VfZm9ybWF0J11cbiAgICBkZWxldGUgYm9keVsnc3RyZWFtJ11cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5wZXJwbGV4aXR5LmFpL2NoYXQvY29tcGxldGlvbnMnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogcHJvY2Vzcy5lbnYuUGVycGxleGl0eVNlY3JldEtleSxcbiAgICAgICAgfSBhcyBhbnksXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgIH0pXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAvLyBMb2cgdGhlIGVycm9yIHJlc3BvbnNlIGZvciBkZWJ1Z2dpbmdcbiAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIFJlc3BvbnNlOicsIGVycm9yVGV4dClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBUEkgcmVxdWVzdCBmYWlsZWQgd2l0aCBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9OiAke2Vycm9yVGV4dH1gKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCByZXNwb25zZVRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHBhcnNlIEpTT04uIFJlc3BvbnNlIHdhczonLCByZXNwb25zZVRleHQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQVBJIHJldHVybmVkIG5vbi1KU09OIHJlc3BvbnNlJylcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb21wbGV0ZUNoYXRGcm9tUHJvbXB0ID0gYXN5bmMgKFxuICAgIHByb21wdDogc3RyaW5nLFxuICAgIHR5cGU6IENoYXRGb2N1cyB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgcmVxdWlyZXNMaXZlRGF0YTogYm9vbGVhbixcbiAgICBjaGF0VHlwZTogQ2hhdFR5cGVcbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdTZW5kaW5nJywgcHJvbXB0LCAnIHRvIGdwdCcpXG4gICAgY29uc3Qgc3lzdGVtUHJvbXB0ID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeVxuICAgICAgICAgICAgPyBuZXdzUHJvbXB0XG4gICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5GaW5hbmNpYWxBbmFseXNpc1F1ZXJ5XG4gICAgICAgICAgICA/IHRlY2huaWNhbFByb21wdFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuU2ltdWxhdGlvbkV4cGFuc2lvblxuICAgICAgICAgICAgPyBleHBhbnNpb25Qcm9tcHRcbiAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgID8gYFlvdSBhcmUgYSBwZXJzb25hbCBzcGVuZGluZyBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBZb3UgcHJvdmlkZSBzcGVuZGluZyByZWNvbW1lbmRhdGlvbnMgd2hpY2ggYXJlIGhpZ2hseSB1c2VmdWwuYFxuICAgICAgICAgICAgOiBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuR2VuZXJhbFJlY29tbWVuZGF0aW9uXG4gICAgICAgICAgICA/ICdZb3UgYXJlIGEgcGVyc29uYWwgZmluYW5jZSBhc3Npc3RhbnQuIFlvdSBsZXZlcmFnZSBkZXRhaWxlZCBrbm93ZWxkZ2Ugb2YganVyaXNkaWN0aW9uYWwgdGF4IGxhd3MgYW5kIGZpbmFuY2lhbCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyB0byBndWlkZSB1cyB0byBtYWtlIGJldHRlciBmaW5hbmNpYWwgZGVjaXNpb25zLiBMZWF2ZSB0aGUgdHJhbnNmZXIgaW5mb3JtYXRpb24gZW1wdHkgaWYgbm8gdHJhbnNmZXIgaXMgbmVlZGVkJ1xuICAgICAgICAgICAgOiBgWW91IGFyZSBhIHBlcnNvbmFsICR7XG4gICAgICAgICAgICAgICAgICB0eXBlICYmIHR5cGUgIT09IENoYXRGb2N1cy5BbGwgPyB0eXBlIDogJ0ZpbmFuY2UnXG4gICAgICAgICAgICAgIH0gYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gYFxuICAgIGNvbnN0IG1vZGVsID1cbiAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLkZpbmFuY2lhbE5ld3NRdWVyeSB8fCBjaGF0VHlwZSA9PT0gQ2hhdFR5cGUuRmluYW5jaWFsQW5hbHlzaXNRdWVyeVxuICAgICAgICAgICAgPyAnbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lJ1xuICAgICAgICAgICAgOiAnZ3B0LTRvJ1xuICAgIGNvbnN0IG1lc3NhZ2VCb2R5ID0ge1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN5c3RlbVByb21wdCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OlxuICAgICAgICAgICAgY2hhdFR5cGUgPT09IENoYXRUeXBlLlRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb25cbiAgICAgICAgICAgICAgICA/IHpvZFJlc3BvbnNlRm9ybWF0KFRyYW5zYWN0aW9uUmVjb21tZW5kYXRpb24sICdyZWNvbW1lbmRhdGlvbnMnKVxuICAgICAgICAgICAgICAgIDogY2hhdFR5cGUgPT09IENoYXRUeXBlLkdlbmVyYWxSZWNvbW1lbmRhdGlvblxuICAgICAgICAgICAgICAgID8gem9kUmVzcG9uc2VGb3JtYXQoUmVjb21tZW5kYXRpb25zLCAncmVjb21tZW5kYXRpb25zJylcbiAgICAgICAgICAgICAgICA6IGNoYXRUeXBlID09PSBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uXG4gICAgICAgICAgICAgICAgPyB6b2RSZXNwb25zZUZvcm1hdChTaW11bGF0aW9uRXhwYW5zaW9uUmVzcG9uc2VGb3JtYXQsICdzaW11bGF0aW9uRXhwYW5zaW9uJylcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgbW9kZWwsXG4gICAgICAgIHN0cmVhbTogdHJ1ZSxcbiAgICB9XG4gICAgY29uc3Qgc3RyZWFtID0gcmVxdWlyZXNMaXZlRGF0YVxuICAgICAgICA/IGF3YWl0IG1ha2VQZXJwbGV4aXR5Q2FsbChtZXNzYWdlQm9keSlcbiAgICAgICAgOiBhd2FpdCBjaGF0LmNvbXBsZXRpb25zLmNyZWF0ZShtZXNzYWdlQm9keSBhcyBhbnkpXG4gICAgbGV0IG1lc3NhZ2UgPSBbXVxuICAgIGxldCBjb3VudCA9IDBcbiAgICBsZXQgYnVmZmVyOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgZmlyc3RGZXdMaW1pdCA9IDMgLy8gU2VuZCB0aGUgZmlyc3QgMyBjaHVua3MgaW1tZWRpYXRlbHlcbiAgICBjb25zdCBiYXRjaFNpemUgPSAxMDAgLy8gVGhlbiBjb21iaW5lIDEwIGNodW5rcyBhdCBhIHRpbWVcbiAgICBjb25zdCBtZXNzYWdlSWQgPSB1c2VySWQgKyAnIycgKyBEYXRlLm5vdygpLnRvU3RyaW5nKClcblxuICAgIGlmICghcmVxdWlyZXNMaXZlRGF0YSkge1xuICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHN0cmVhbSBhcyBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBjaHVuay5jaG9pY2VzWzBdPy5kZWx0YT8uY29udGVudCB8fCAnJ1xuXG4gICAgICAgICAgICAvLyBGb3IgdGhlIGZpcnN0IGZldyBjaHVua3MsIHNlbmQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjb3VudCA8IGZpcnN0RmV3TGltaXQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0dvdDonLCBjb250ZW50KVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UucHVzaChjb250ZW50KVxuICAgICAgICAgICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbnRlbnQsIGZhbHNlLCBtZXNzYWdlSWQpXG4gICAgICAgICAgICAgICAgY291bnQgPSBjb3VudCArIDFcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIGZpcnN0IGZldywgYWNjdW11bGF0ZSBjaHVua3MgaW4gYSBidWZmZXJcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaChjb250ZW50KVxuXG4gICAgICAgICAgICAgICAgLy8gT25jZSB3ZSd2ZSBhY2N1bXVsYXRlZCBlbm91Z2ggY2h1bmtzIChiYXRjaFNpemUpLCBzZW5kIHRoZW0gYXMgb25lIGNvbWJpbmVkIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gYmF0Y2hTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVkTWVzc2FnZSA9IGJ1ZmZlci5qb2luKCcnKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1NlbmRpbmcgY29tYmluZWQgbWVzc2FnZTonLCBjb21iaW5lZE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgIHNlbmRDaGF0VG9VSSh1c2VySWQsIGNvdW50LnRvU3RyaW5nKCksIGNvbWJpbmVkTWVzc2FnZSwgZmFsc2UsIG1lc3NhZ2VJZClcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5wdXNoKGNvbWJpbmVkTWVzc2FnZSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgYnVmZmVyIGFmdGVyIHNlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gW11cbiAgICAgICAgICAgICAgICAgICAgY291bnQgPSBjb3VudCArIDFcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbmNyZW1lbnQgdGhlIGNvdW50ZXIgZXZlbiB3aGVuIGJ1ZmZlcmluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IFtzdHJlYW0/LmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50IHx8ICcnXVxuICAgIH1cbiAgICAvLyBJZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBjaHVua3MgaW4gdGhlIGJ1ZmZlciBhZnRlciB0aGUgbG9vcCBlbmRzLCBzZW5kIHRoZW1cbiAgICBpZiAoYnVmZmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRNZXNzYWdlID0gYnVmZmVyLmpvaW4oJycpXG4gICAgICAgIGNvbnNvbGUuaW5mbygnU2VuZGluZyBmaW5hbCBjb21iaW5lZCBtZXNzYWdlOicsIGNvbWJpbmVkTWVzc2FnZSlcbiAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgY29tYmluZWRNZXNzYWdlLCB0cnVlLCBtZXNzYWdlSWQpXG4gICAgICAgIG1lc3NhZ2UucHVzaChjb21iaW5lZE1lc3NhZ2UpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2VuZENoYXRUb1VJKHVzZXJJZCwgY291bnQudG9TdHJpbmcoKSwgJycsIHRydWUsIG1lc3NhZ2VJZClcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2Uuam9pbignJylcbn1cblxuZXhwb3J0IGVudW0gSW5mb3JtYXRpb25PcHRpb25zIHtcbiAgICAnSU5WRVNUTUVOVFMnLFxuICAgICdUUkFOU0FDVElPTlMnLFxuICAgICdBQ0NPVU5UUycsXG4gICAgJ01PTlRITFlTVU1NQVJJRVMnLFxufVxuZXhwb3J0IGludGVyZmFjZSBHcHREYXRlUmVzcG9uc2Uge1xuICAgIGRheTogbnVtYmVyXG4gICAgbW9udGg6IG51bWJlclxuICAgIHllYXI6IG51bWJlclxufVxuZXhwb3J0IGludGVyZmFjZSBEYXRhUmFuZ2VSZXNwb25zZSB7XG4gICAgc3RhcnREYXk6IEdwdERhdGVSZXNwb25zZVxuICAgIGVuZERheTogR3B0RGF0ZVJlc3BvbnNlXG4gICAgaGFzTm9UaW1lQ29uc3RyYWludDogYm9vbGVhblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZm9ybWF0aW9uT3B0aW9uc1Jlc3BvbnNlIHtcbiAgICBvcHRpb25zRm9ySW5mb3JtYXRpb246IEluZm9ybWF0aW9uT3B0aW9uc1tdXG59XG5cbmZ1bmN0aW9uIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKSAvLyBHZXQgdGhlIGN1cnJlbnQgZGF0ZSBhbmQgdGltZVxuXG4gICAgLy8gRXh0cmFjdCB5ZWFyLCBtb250aCwgYW5kIGRheVxuICAgIGNvbnN0IHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKVxuICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKG5vdy5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKSAvLyBNb250aHMgYXJlIDAtYmFzZWQsIHNvIGFkZCAxXG4gICAgY29uc3QgZGF5ID0gU3RyaW5nKG5vdy5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJylcblxuICAgIC8vIFJldHVybiB0aGUgZm9ybWF0dGVkIGRhdGUgYXMgJ1lZWVktTU0tREQnXG4gICAgcmV0dXJuIGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fWBcbn1cblxuZXhwb3J0IGNvbnN0IGdldERhdGVSYW5nZUZyb21Nb2RlbCA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IEFjY2VwdGFibGVWYWx1ZXNGb3JEYXRlUmFuZ2UgPSB6Lm9iamVjdCh7XG4gICAgICAgIHN0YXJ0RGF5OiB6Lm9iamVjdCh7XG4gICAgICAgICAgICBkYXk6IHoubnVtYmVyKCksXG4gICAgICAgICAgICBtb250aDogei5udW1iZXIoKSxcbiAgICAgICAgICAgIHllYXI6IHoubnVtYmVyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBlbmREYXk6IHoub2JqZWN0KHtcbiAgICAgICAgICAgIGRheTogei5udW1iZXIoKSxcbiAgICAgICAgICAgIG1vbnRoOiB6Lm51bWJlcigpLFxuICAgICAgICAgICAgeWVhcjogei5udW1iZXIoKSxcbiAgICAgICAgfSksXG4gICAgICAgIGhhc05vVGltZUNvbnN0cmFpbnQ6IHouYm9vbGVhbigpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgJ1RoZSBjdXJyZW50IGRhdGUgaXMgJyArXG4gICAgICAgICAgICAgICAgICAgIGdldEZvcm1hdHRlZEN1cnJlbnREYXRlKCkgK1xuICAgICAgICAgICAgICAgICAgICAnIEZpbGwgb3V0IHRoZSBiZXN0IHN1aXRlZCBkYXRlIHJhbmdlIGZvciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiAnICtcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LnN1YnN0cmluZygwLCAxMDApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogem9kUmVzcG9uc2VGb3JtYXQoQWNjZXB0YWJsZVZhbHVlc0ZvckRhdGVSYW5nZSwgJ2RhdGVSYW5nZScpLFxuICAgIH0pXG4gICAgcmV0dXJuIGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIVxufVxuXG5leHBvcnQgY29uc3QgZ2V0TmVlZGVkSW5mb3JtYXRpb25Gcm9tTW9kZWwgPSBhc3luYyAocHJvbXB0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZyBuZWVkZWQgaW5mb3JtYXRpb24nKVxuICAgIGNvbnN0IEFjY2VwdGFibGVJbmZvcm1hdGlvbk9wdGlvbnMgPSB6Lm9iamVjdCh7XG4gICAgICAgIG9wdGlvbnNGb3JJbmZvcm1hdGlvbjogei5hcnJheSh6LmVudW0oWydJTlZFU1RNRU5UUycsICdUUkFOU0FDVElPTlMnLCAnQUNDT1VOVFMnXSkpLFxuICAgIH0pXG4gICAgY29uc3QgY2hhdE91dHB1dCA9IGF3YWl0IGNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1doYXQgaW5mb3JtYXRpb24gaXMgYmVzdCBzdWl0ZWQgdG8gYW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlcnk6ICcgKyBwcm9tcHQuc3Vic3RyaW5nKDAsIDEwMCksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB6b2RSZXNwb25zZUZvcm1hdChBY2NlcHRhYmxlSW5mb3JtYXRpb25PcHRpb25zLCAnZGF0ZVJhbmdlJyksXG4gICAgfSlcbiAgICByZXR1cm4gY2hhdE91dHB1dC5jaG9pY2VzWzBdLm1lc3NhZ2UhXG59XG5cbmNvbnN0IGZsYXR0ZW4gPSAodmFsdWU6IGFueSk6IGFueVtdID0+IHtcbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGZsYXR0ZW4gZWFjaCBlbGVtZW50IHJlY3Vyc2l2ZWx5XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5mbGF0TWFwKGZsYXR0ZW4pIC8vIFVzZSBmbGF0TWFwIHRvIGZsYXR0ZW4gdGhlIGFycmF5IHJlY3Vyc2l2ZWx5XG4gICAgfVxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3QsIGZsYXR0ZW4gaXRzIHZhbHVlcyByZWN1cnNpdmVseVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmbGF0dGVuKE9iamVjdC52YWx1ZXModmFsdWUpKVxuICAgIH1cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYW4gb2JqZWN0LCByZXR1cm4gaXQgYXMgYSBzaW5nbGUtZWxlbWVudCBhcnJheVxuICAgIHJldHVybiBbdmFsdWVdXG59XG5cbmV4cG9ydCBjb25zdCBnZXRUZWNobmljYWxXb3Jkc1doZXJlV2VDYW5Hb0RlZXBlciA9IGFzeW5jIChwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGF0T3V0cHV0ID0gYXdhaXQgY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgJ1dlIGFyZSBzdW1tYXJpemluZyBmaW5hbmNpYWwgaW5mb3JtYXRpb24gcmV0dXJuIHRoZSBleGFjdCBwaHJhc2VzIChpbmNsdWRlIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgcHVuY3R1YXRpb24pIHdoZXJlIHdlIGNvdWxkIGRvIGZpbmFuY2lhbCBhbmFseXNpcyBpbnRvIHRoZSB0b3BpYy4gIHJlc3BvbmQgaW4gdGhlIGpzb24gZm9ybWF0IFtwaHJhc2UxLCBwaHJhc2UyXV0nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHByb21wdC5zdWJzdHJpbmcoMCwgMjAwMDApLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfSxcbiAgICAgICAgICAgIG1vZGVsOiAnZ3B0LTMuNS10dXJibycsXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGpzb25PYmplY3QgPSBKU09OLnBhcnNlKGNoYXRPdXRwdXQuY2hvaWNlc1swXS5tZXNzYWdlIS5jb250ZW50IHx8ICcnKVxuICAgICAgICBpZiAoanNvbk9iamVjdC5waHJhc2UxIHx8IGpzb25PYmplY3QucGhyYXNlcyB8fCBPYmplY3Qua2V5cyhqc29uT2JqZWN0KS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihPYmplY3QudmFsdWVzKGpzb25PYmplY3QpKVxuICAgICAgICB9IGVsc2UgaWYgKGpzb25PYmplY3QubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhdHRlbihqc29uT2JqZWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBbXVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUFzc2lzdGFudCA9IGFzeW5jICgpID0+XG4gICAgYXBpQ2xpZW50LmJldGEuYXNzaXN0YW50cy5jcmVhdGUoe1xuICAgICAgICBpbnN0cnVjdGlvbnM6XG4gICAgICAgICAgICAnWW91IGFyZSBhIHBlcnNvbmFsIGZpbmFuY2UgYXNzaXN0YW50LiBZb3UgbGV2ZXJhZ2UgZGV0YWlsZWQga25vd2VsZGdlIG9mIGp1cmlzZGljdGlvbmFsIHRheCBsYXdzIGFuZCBmaW5hbmNpYWwgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMgdG8gZ3VpZGUgdXMgdG8gbWFrZSBiZXR0ZXIgZmluYW5jaWFsIGRlY2lzaW9ucy4gd3JpdGUgYW5kIHJ1biBjb2RlIHRvIGFuc3dlciB0aGUgcXVlc3Rpb24uJyxcbiAgICAgICAgbW9kZWw6ICdncHQtNG8tbWluaScsXG4gICAgICAgIHRvb2xzOiBbeyB0eXBlOiAnY29kZV9pbnRlcnByZXRlcicgfV0sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IHVwbG9hZEZpbGVUb0Fzc2lzdGFudCA9IGFzeW5jIChmaWxlOiBGaWxlKSA9PiB7XG4gICAgLy8gVXBsb2FkIGEgZmlsZSB3aXRoIGFuIFwiYXNzaXN0YW50c1wiIHB1cnBvc2VcbiAgICBjb25zdCBmaWxlUmV0dXJuID0gYXdhaXQgYXBpQ2xpZW50LmZpbGVzLmNyZWF0ZSh7XG4gICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgIHB1cnBvc2U6ICdhc3Npc3RhbnRzJyxcbiAgICB9KVxuICAgIHJldHVybiBmaWxlUmV0dXJuXG59XG5cbmV4cG9ydCBjb25zdCBjb2RlSW50ZXJwZXJ0ZXJGb3JBbmFseXNpcyA9IGFzeW5jIChmaWxlSWRzOiBzdHJpbmdbXSwgYXNzaXN0YW50X2lkOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGhyZWFkID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5jcmVhdGUoe1xuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgYXR0YWNobWVudHM6IGZpbGVJZHMubWFwKChmaWxlSWQpID0+ICh7IGZpbGVfaWQ6IGZpbGVJZCwgdG9vbHM6IFt7IHR5cGU6ICdjb2RlX2ludGVycHJldGVyJyB9XSB9KSksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pXG4gICAgcmV0dXJuIHRocmVhZFxufVxuXG5leHBvcnQgY29uc3QgcnVuVGhyZWFkID0gYXN5bmMgKHRocmVhZElkOiBzdHJpbmcsIGFzc2lzdGFudF9pZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcnVuUGFyYW1zID0ge1xuICAgICAgICBhc3Npc3RhbnRfaWQ6IGFzc2lzdGFudF9pZCxcbiAgICAgICAgdG9vbF9jaG9pY2U6IHsgdHlwZTogJ2NvZGVfaW50ZXJwcmV0ZXInIH0gYXMgQXNzaXN0YW50VG9vbENob2ljZSxcbiAgICB9XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5ydW5zLmNyZWF0ZUFuZFBvbGwodGhyZWFkSWQsIHJ1blBhcmFtcylcbiAgICAvLyBVcGxvYWQgYSBmaWxlIHdpdGggYW4gXCJhc3Npc3RhbnRzXCIgcHVycG9zZVxuICAgIGNvbnNvbGUubG9nKHN0YXR1cylcbiAgICByZXR1cm4gc3RhdHVzXG59XG5cbmV4cG9ydCBjb25zdCBsaXN0TWVzc2FnZXNGb3JUaHJlYWQgPSBhc3luYyAodGhyZWFkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgYXBpQ2xpZW50LmJldGEudGhyZWFkcy5tZXNzYWdlcy5saXN0KHRocmVhZElkKVxuICAgIC8vIFVwbG9hZCBhIGZpbGUgd2l0aCBhbiBcImFzc2lzdGFudHNcIiBwdXJwb3NlXG4gICAgY29uc29sZS5sb2cobWVzc2FnZXMpXG4gICAgcmV0dXJuIG1lc3NhZ2VzXG59XG5cbmV4cG9ydCBjb25zdCBzZW5kQ2hhdFRvVUkgPSBhc3luYyAoXG4gICAgcGs6IHN0cmluZyxcbiAgICBzazogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBpc0xhc3RDaHVuazogYm9vbGVhbixcbiAgICBtZXNzYWdlSWQ6IHN0cmluZ1xuKSA9PiB7XG4gICAgLy8gVE9ETzogZXhwaXJlIHRoZSBjaGF0c1xuICAgIGNvbnN0IGNoYXRJbnB1dDogQ2hhdElucHV0ID0ge1xuICAgICAgICBwazogcGssXG4gICAgICAgIHNrOiBzayxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgdGltZTogRGF0ZS5ub3coKS50b1N0cmluZygpLFxuICAgICAgICBpc0xhc3RDaHVuayxcbiAgICAgICAgbWVzc2FnZUlkLFxuICAgIH1cblxuICAgIC8vIFByZXBhcmUgR3JhcGhRTCByZXF1ZXN0IHBheWxvYWRcbiAgICBjb25zdCBncmFwaHFsRGF0YSA9IHtcbiAgICAgICAgcXVlcnk6IGNyZWF0ZUNoYXQsXG4gICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgY2hhdDogY2hhdElucHV0LFxuICAgICAgICB9LFxuICAgIH1cbiAgICBjb25zdCBwb3N0Qm9keSA9IEpTT04uc3RyaW5naWZ5KGdyYXBocWxEYXRhKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3JlZGVudGlhbHMgPSBhd2FpdCBkZWZhdWx0UHJvdmlkZXIoKSgpXG4gICAgICAgIGNvbnN0IHVyaSA9IG5ldyBVUkwoYXBwc3luY1VybClcbiAgICAgICAgY29uc3QgaHR0cFJlcXVlc3QgPSB7XG4gICAgICAgICAgICBob3N0bmFtZTogdXJpLmhvc3RuYW1lLFxuICAgICAgICAgICAgcGF0aDogdXJpLnBhdGhuYW1lLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgaG9zdDogdXJpLmhvc3RuYW1lLFxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogcG9zdEJvZHksXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgYSBzaWduZXIgb2JqZWN0XG4gICAgICAgIGNvbnN0IHNpZ25lciA9IGF3czQuc2lnbihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZWdpb246ICdjYS1jZW50cmFsLTEnLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdhcHBzeW5jJywgLy8gQXBwU3luYyBpcyB0aGUgc2VydmljZSB3ZSdyZSBpbnRlcmFjdGluZyB3aXRoXG4gICAgICAgICAgICAgICAgcGF0aDogaHR0cFJlcXVlc3QucGF0aCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiBodHRwUmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogaHR0cFJlcXVlc3QubWV0aG9kLFxuICAgICAgICAgICAgICAgIGJvZHk6IGh0dHBSZXF1ZXN0LmJvZHksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFjY2Vzc0tleUlkOiBjcmVkZW50aWFscy5hY2Nlc3NLZXlJZCxcbiAgICAgICAgICAgICAgICBzZWNyZXRBY2Nlc3NLZXk6IGNyZWRlbnRpYWxzLnNlY3JldEFjY2Vzc0tleSxcbiAgICAgICAgICAgICAgICBzZXNzaW9uVG9rZW46IGNyZWRlbnRpYWxzLnNlc3Npb25Ub2tlbixcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuXG4gICAgICAgIC8vIFNpZ24gdGhlIHJlcXVlc3RcbiAgICAgICAgT2JqZWN0LmFzc2lnbihodHRwUmVxdWVzdC5oZWFkZXJzLCBzaWduZXIuaGVhZGVycylcblxuICAgICAgICAvLyBNYWtlIHRoZSBIVFRQIHJlcXVlc3RcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmkuaHJlZiwgaHR0cFJlcXVlc3QpXG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKClcblxuICAgICAgICBjb25zb2xlLmxvZyhgSlNPTiBSZXNwb25zZSA9ICR7SlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMil9YClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBGRVRDSCBFUlJPUjogJHtKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMil9YClcbiAgICB9XG59XG4iXX0=