import { AppSyncIdentityCognito, AppSyncResolverEvent, AppSyncResolverHandler, Context } from 'aws-lambda'
import { ChatFocus, ChatType, ExpandFinancialSimulation, FinancialSimulationExpansion } from './API'
import { completeChatFromPrompt, SimulationExpansionResponseInterface } from './gpt'
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
    const message = `${previousCodeRun} Expand the script, do not rename the function, input keys is every key we expect in the body parameter. ${event.arguments.chat.message}`
    const response = await completeChatFromPrompt(message, ChatFocus.All, user, false, ChatType.SimulationExpansion)
    const recommentations = JSON.parse(response || '') as SimulationExpansionResponseInterface
    const newCode = recommentations.newCode
    const newFileKey = user + '-' + Math.floor(Math.random() * 1000000)
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
        newInputs: recommentations.inputKeys,
        description: recommentations.highLevelDescriptionOfIdeaWithoutMentioningCode,
    }
}
