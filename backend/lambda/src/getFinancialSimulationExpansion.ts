import { AppSyncIdentityCognito, AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatFocus, ChatType, ExpandFinancialSimulation, FinancialSimulationExpansion } from './API'
import {
    completeChatFromPrompt,
    sendChatToUI,
    SimulationExpansionResponseInterface,
    SimulationPreExpansionResponseInterface,
} from './gpt'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { previousCode } from './stockPrompts'
const s3 = new S3Client({ region: process.env.AWS_REGION })

export const getFinancialSimulationExpansion: AppSyncResolverHandler<any, FinancialSimulationExpansion | void> = async (
    event: AppSyncResolverEvent<{ chat: ExpandFinancialSimulation }>,
    context: Context
) => {
    const user = (event.identity as AppSyncIdentityCognito)?.username

    let previousCodeRun = previousCode
    if (event.arguments.chat.s3Key) {
        const bucketName = process.env.S3_BUCKET // Ensure this environment variable is set
        const s3Key = event.arguments.chat.s3Key

        try {
            const command = new GetObjectCommand({
                Bucket: bucketName!,
                Key: s3Key,
            })

            const s3Response = await s3.send(command)

            if (s3Response.Body) {
                const bodyContents = await s3Response.Body.transformToString() // Automatically convert to string
                previousCodeRun = bodyContents
            } else {
                throw new Error('File content is empty or invalid.')
            }
        } catch (error) {
            console.error('Error fetching S3 file:', error)
            throw new Error('Failed to retrieve S3 file.')
        }
    }
    const message1 = `${previousCodeRun} \nBased on the code and the following prompt, tell us what inputs we will need to add to accomadate, do not rewrite the code. ${event.arguments.chat.message}`
    const response1 = await completeChatFromPrompt(
        message1,
        ChatFocus.All,
        user,
        false,
        ChatType.SimulationPreExpansion
    )
    const parsedSimulationPreExpansionResponse = JSON.parse(response1 || '') as SimulationPreExpansionResponseInterface

    await sendChatToUI(
        user,
        'SimulationPreExpansionMessage',
        JSON.stringify({
            __typename: 'FinancialSimulationPreExpansion',
            inputs: parsedSimulationPreExpansionResponse.inputKeys,
            description: parsedSimulationPreExpansionResponse.highLevelDescriptionOfIdeaWithoutMentioningCode,
            title: parsedSimulationPreExpansionResponse.title,
        }),
        true,
        user + Date.now().toString()
    )
    const message = `${previousCodeRun} Expand the script, do not rename the function, the input set in body will now include the keys ${parsedSimulationPreExpansionResponse.inputKeys
        .map((el) => `${el.name}: ${el.defaultValue}, `)
        .join(
            ', '
        )} All users are in Canada and use the registered Accounts: FHSA, RSPs, TFSAs. Output the updated script as runnable code`
    const response = await completeChatFromPrompt(message, ChatFocus.All, user, false, ChatType.SimulationExpansion)
    const recommentations = JSON.parse(response || '') as SimulationExpansionResponseInterface
    const newCode = recommentations.newCode
    const newFileKey = user + '-' + Math.floor(Math.random() * 1000000)

    await sendChatToUI(
        user,
        'SimulationExpansionMessage',
        JSON.stringify({
            __typename: 'FinancialSimulationExpansion',
            s3Key: newFileKey,
        }),
        true,
        user + Date.now().toString()
    )
    try {
        // Upload new code to S3
        const putCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: newFileKey,
            Body: newCode,
            ContentType: 'application/javascript', // Assuming it's JS code
        })

        await s3.send(putCommand)

        console.log(`New code uploaded to S3: ${newFileKey}`)
    } catch (error) {
        console.error('Error uploading new code to S3:', error)
        throw new Error('Failed to upload new code to S3.')
    }

    console.debug('Got', recommentations, ' From GPT')
    return {
        __typename: 'FinancialSimulationExpansion',
        s3Key: newFileKey,
    }
}
