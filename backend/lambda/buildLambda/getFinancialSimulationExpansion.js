"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialSimulationExpansion = void 0;
const API_1 = require("./API");
const gpt_1 = require("./gpt");
const client_s3_1 = require("@aws-sdk/client-s3");
const stockPrompts_1 = require("./stockPrompts");
const s3 = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
const getFinancialSimulationExpansion = async (event, context) => {
    const user = event.identity?.username;
    let previousCodeRun = stockPrompts_1.previousCode;
    if (event.arguments.chat.s3Key) {
        const bucketName = process.env.S3_BUCKET; // Ensure this environment variable is set
        const s3Key = event.arguments.chat.s3Key;
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
            });
            const s3Response = await s3.send(command);
            if (s3Response.Body) {
                const bodyContents = await s3Response.Body.transformToString(); // Automatically convert to string
                previousCodeRun = bodyContents;
            }
            else {
                throw new Error('File content is empty or invalid.');
            }
        }
        catch (error) {
            console.error('Error fetching S3 file:', error);
            throw new Error('Failed to retrieve S3 file.');
        }
    }
    const message = `${previousCodeRun} Expand the script, do not rename the function, input keys is every key we expect in the body parameter. ${event.arguments.chat.message}`;
    const response = await (0, gpt_1.completeChatFromPrompt)(message, API_1.ChatFocus.All, user, false, API_1.ChatType.SimulationExpansion);
    const recommentations = JSON.parse(response || '');
    const newCode = recommentations.newCode;
    const newFileKey = user + '-' + Math.floor(Math.random() * 1000000);
    try {
        // Upload new code to S3
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: newFileKey,
            Body: newCode,
            ContentType: 'application/javascript', // Assuming it's JS code
        });
        await s3.send(putCommand);
        console.log(`New code uploaded to S3: ${newFileKey}`);
    }
    catch (error) {
        console.error('Error uploading new code to S3:', error);
        throw new Error('Failed to upload new code to S3.');
    }
    console.debug('Got', recommentations, ' From GPT');
    return {
        __typename: 'FinancialSimulationExpansion',
        s3Key: newFileKey,
        newInputs: recommentations.inputKeys,
        description: recommentations.highLevelDescriptionOfIdeaWithoutMentioningCode,
    };
};
exports.getFinancialSimulationExpansion = getFinancialSimulationExpansion;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0RmluYW5jaWFsU2ltdWxhdGlvbkV4cGFuc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9nZXRGaW5hbmNpYWxTaW11bGF0aW9uRXhwYW5zaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLCtCQUFvRztBQUNwRywrQkFBb0Y7QUFDcEYsa0RBQWlGO0FBQ2pGLGlEQUE2QztBQUM3QyxNQUFNLEVBQUUsR0FBRyxJQUFJLG9CQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO0FBRXBELE1BQU0sK0JBQStCLEdBQXFFLEtBQUssRUFDbEgsS0FBZ0UsRUFDaEUsT0FBZ0IsRUFDbEIsRUFBRTtJQUNBLE1BQU0sSUFBSSxHQUFJLEtBQUssQ0FBQyxRQUFtQyxFQUFFLFFBQVEsQ0FBQTtJQUVqRSxJQUFJLGVBQWUsR0FBRywyQkFBWSxDQUFBO0lBQ2xDLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUEsQ0FBQywwQ0FBMEM7UUFDbkYsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBRXhDLElBQUksQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQWdCLENBQUM7Z0JBQ2pDLE1BQU0sRUFBRSxVQUFXO2dCQUNuQixHQUFHLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQTtZQUVGLE1BQU0sVUFBVSxHQUFHLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUV6QyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxZQUFZLEdBQUcsTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUEsQ0FBQyxrQ0FBa0M7Z0JBQ2pHLGVBQWUsR0FBRyxZQUFZLENBQUE7WUFDbEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQTtZQUN4RCxDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtRQUNsRCxDQUFDO0lBQ0wsQ0FBQztJQUNELE1BQU0sT0FBTyxHQUFHLEdBQUcsZUFBZSw0R0FBNEcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDNUssTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLDRCQUFzQixFQUFDLE9BQU8sRUFBRSxlQUFTLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsY0FBUSxDQUFDLG1CQUFtQixDQUFDLENBQUE7SUFDaEgsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUF5QyxDQUFBO0lBQzFGLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUE7SUFDdkMsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQTtJQUNuRSxJQUFJLENBQUM7UUFDRCx3QkFBd0I7UUFDeEIsTUFBTSxVQUFVLEdBQUcsSUFBSSw0QkFBZ0IsQ0FBQztZQUNwQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO1lBQzdCLEdBQUcsRUFBRSxVQUFVO1lBQ2YsSUFBSSxFQUFFLE9BQU87WUFDYixXQUFXLEVBQUUsd0JBQXdCLEVBQUUsd0JBQXdCO1NBQ2xFLENBQUMsQ0FBQTtRQUVGLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUV6QixPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixVQUFVLEVBQUUsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUE7SUFDdkQsQ0FBQztJQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUNsRCxPQUFPO1FBQ0gsVUFBVSxFQUFFLDhCQUE4QjtRQUMxQyxLQUFLLEVBQUUsVUFBVTtRQUNqQixTQUFTLEVBQUUsZUFBZSxDQUFDLFNBQVM7UUFDcEMsV0FBVyxFQUFFLGVBQWUsQ0FBQywrQ0FBK0M7S0FDL0UsQ0FBQTtBQUNMLENBQUMsQ0FBQTtBQTNEWSxRQUFBLCtCQUErQixtQ0EyRDNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwU3luY0lkZW50aXR5Q29nbml0bywgQXBwU3luY1Jlc29sdmVyRXZlbnQsIEFwcFN5bmNSZXNvbHZlckhhbmRsZXIsIENvbnRleHQgfSBmcm9tICdhd3MtbGFtYmRhJ1xuaW1wb3J0IHsgQ2hhdEZvY3VzLCBDaGF0VHlwZSwgRXhwYW5kRmluYW5jaWFsU2ltdWxhdGlvbiwgRmluYW5jaWFsU2ltdWxhdGlvbkV4cGFuc2lvbiB9IGZyb20gJy4vQVBJJ1xuaW1wb3J0IHsgY29tcGxldGVDaGF0RnJvbVByb21wdCwgU2ltdWxhdGlvbkV4cGFuc2lvblJlc3BvbnNlSW50ZXJmYWNlIH0gZnJvbSAnLi9ncHQnXG5pbXBvcnQgeyBTM0NsaWVudCwgR2V0T2JqZWN0Q29tbWFuZCwgUHV0T2JqZWN0Q29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zMydcbmltcG9ydCB7IHByZXZpb3VzQ29kZSB9IGZyb20gJy4vc3RvY2tQcm9tcHRzJ1xuY29uc3QgczMgPSBuZXcgUzNDbGllbnQoeyByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfSlcblxuZXhwb3J0IGNvbnN0IGdldEZpbmFuY2lhbFNpbXVsYXRpb25FeHBhbnNpb246IEFwcFN5bmNSZXNvbHZlckhhbmRsZXI8YW55LCBGaW5hbmNpYWxTaW11bGF0aW9uRXhwYW5zaW9uIHwgdm9pZD4gPSBhc3luYyAoXG4gICAgZXZlbnQ6IEFwcFN5bmNSZXNvbHZlckV2ZW50PHsgY2hhdDogRXhwYW5kRmluYW5jaWFsU2ltdWxhdGlvbiB9PixcbiAgICBjb250ZXh0OiBDb250ZXh0XG4pID0+IHtcbiAgICBjb25zdCB1c2VyID0gKGV2ZW50LmlkZW50aXR5IGFzIEFwcFN5bmNJZGVudGl0eUNvZ25pdG8pPy51c2VybmFtZVxuXG4gICAgbGV0IHByZXZpb3VzQ29kZVJ1biA9IHByZXZpb3VzQ29kZVxuICAgIGlmIChldmVudC5hcmd1bWVudHMuY2hhdC5zM0tleSkge1xuICAgICAgICBjb25zdCBidWNrZXROYW1lID0gcHJvY2Vzcy5lbnYuUzNfQlVDS0VUIC8vIEVuc3VyZSB0aGlzIGVudmlyb25tZW50IHZhcmlhYmxlIGlzIHNldFxuICAgICAgICBjb25zdCBzM0tleSA9IGV2ZW50LmFyZ3VtZW50cy5jaGF0LnMzS2V5XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lISxcbiAgICAgICAgICAgICAgICBLZXk6IHMzS2V5LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgY29uc3QgczNSZXNwb25zZSA9IGF3YWl0IHMzLnNlbmQoY29tbWFuZClcblxuICAgICAgICAgICAgaWYgKHMzUmVzcG9uc2UuQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvZHlDb250ZW50cyA9IGF3YWl0IHMzUmVzcG9uc2UuQm9keS50cmFuc2Zvcm1Ub1N0cmluZygpIC8vIEF1dG9tYXRpY2FsbHkgY29udmVydCB0byBzdHJpbmdcbiAgICAgICAgICAgICAgICBwcmV2aW91c0NvZGVSdW4gPSBib2R5Q29udGVudHNcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWxlIGNvbnRlbnQgaXMgZW1wdHkgb3IgaW52YWxpZC4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgUzMgZmlsZTonLCBlcnJvcilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHJldHJpZXZlIFMzIGZpbGUuJylcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBtZXNzYWdlID0gYCR7cHJldmlvdXNDb2RlUnVufSBFeHBhbmQgdGhlIHNjcmlwdCwgZG8gbm90IHJlbmFtZSB0aGUgZnVuY3Rpb24sIGlucHV0IGtleXMgaXMgZXZlcnkga2V5IHdlIGV4cGVjdCBpbiB0aGUgYm9keSBwYXJhbWV0ZXIuICR7ZXZlbnQuYXJndW1lbnRzLmNoYXQubWVzc2FnZX1gXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGV0ZUNoYXRGcm9tUHJvbXB0KG1lc3NhZ2UsIENoYXRGb2N1cy5BbGwsIHVzZXIsIGZhbHNlLCBDaGF0VHlwZS5TaW11bGF0aW9uRXhwYW5zaW9uKVxuICAgIGNvbnN0IHJlY29tbWVudGF0aW9ucyA9IEpTT04ucGFyc2UocmVzcG9uc2UgfHwgJycpIGFzIFNpbXVsYXRpb25FeHBhbnNpb25SZXNwb25zZUludGVyZmFjZVxuICAgIGNvbnN0IG5ld0NvZGUgPSByZWNvbW1lbnRhdGlvbnMubmV3Q29kZVxuICAgIGNvbnN0IG5ld0ZpbGVLZXkgPSB1c2VyICsgJy0nICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMClcbiAgICB0cnkge1xuICAgICAgICAvLyBVcGxvYWQgbmV3IGNvZGUgdG8gUzNcbiAgICAgICAgY29uc3QgcHV0Q29tbWFuZCA9IG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogcHJvY2Vzcy5lbnYuUzNfQlVDS0VULFxuICAgICAgICAgICAgS2V5OiBuZXdGaWxlS2V5LFxuICAgICAgICAgICAgQm9keTogbmV3Q29kZSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcsIC8vIEFzc3VtaW5nIGl0J3MgSlMgY29kZVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHMzLnNlbmQocHV0Q29tbWFuZClcblxuICAgICAgICBjb25zb2xlLmxvZyhgTmV3IGNvZGUgdXBsb2FkZWQgdG8gUzM6ICR7bmV3RmlsZUtleX1gKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHVwbG9hZGluZyBuZXcgY29kZSB0byBTMzonLCBlcnJvcilcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gdXBsb2FkIG5ldyBjb2RlIHRvIFMzLicpXG4gICAgfVxuXG4gICAgY29uc29sZS5kZWJ1ZygnR290JywgcmVjb21tZW50YXRpb25zLCAnIEZyb20gR1BUJylcbiAgICByZXR1cm4ge1xuICAgICAgICBfX3R5cGVuYW1lOiAnRmluYW5jaWFsU2ltdWxhdGlvbkV4cGFuc2lvbicsXG4gICAgICAgIHMzS2V5OiBuZXdGaWxlS2V5LFxuICAgICAgICBuZXdJbnB1dHM6IHJlY29tbWVudGF0aW9ucy5pbnB1dEtleXMsXG4gICAgICAgIGRlc2NyaXB0aW9uOiByZWNvbW1lbnRhdGlvbnMuaGlnaExldmVsRGVzY3JpcHRpb25PZklkZWFXaXRob3V0TWVudGlvbmluZ0NvZGUsXG4gICAgfVxufVxuIl19