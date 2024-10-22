import { util } from '@aws-appsync/utils'
export function request(ctx) {
    return {
        operation: 'Invoke',
        payload: {
            arguments: ctx.args,
            field: 'getFinancialRecommendations',
        },
    }
}

export function response(ctx) {
    const { error, result } = ctx
    if (error) {
        util.error(error.message, error.type, result)
    }
    console.log(result)
    return result
}
