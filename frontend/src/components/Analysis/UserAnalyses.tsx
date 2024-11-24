import { Text, View, StyleSheet } from 'react-native'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import { getFinancialProjection, setActiveSimulation } from '../../../src/features/analysis'
import { generateClient } from 'aws-amplify/api'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { selectRegisteredSavingsPerAccounts } from '../../../src/features/transactions'

const UserAnalyses = () => {
    const analyses = useAppSelector((state) => state.simulations.simulations)
    const dispatch = useAppDispatch()
    const client = generateClient()
    const inputs = useAppSelector((state) => state.simulations.analysisFields)
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const monthlySpendings = useAppSelector((state) => state.transactions.monthlySummaries)
    const estimatedSavings = useAppSelector(selectRegisteredSavingsPerAccounts)
    const activeSimulationName = useAppSelector((state) => state.analysis.activeSimulationName)
    const defaultParams = useDefaultValuesForProjection({
        accounts: accounts,
        monthlySpendings: monthlySpendings,
        estimatedSavings,
    })
    return (
        <View>
            {analyses?.map((el) => {
                return (
                    <div className={activeSimulationName === el?.analysisName ? 'bg-primary rounded-3xl p-4' : 'p-2'}>
                        <Text
                            style={
                                activeSimulationName === el?.analysisName
                                    ? styles.clickableText
                                    : styles.notActiveClickable
                            }
                            onPress={() => {
                                dispatch(setActiveSimulation(el))
                                const desiredInputs = el?.currentInputs
                                    ?.map((input) => inputs?.find((el) => el?.inputName === input))
                                    .filter((e) => e)
                                const object: Record<string, any> = {}
                                desiredInputs?.forEach(
                                    (el) =>
                                        (object[(el?.inputName ?? '') as any as string] =
                                            typeof el?.inputValue === 'string' && !isNaN(parseFloat(el?.inputValue))
                                                ? parseFloat(el?.inputValue)
                                                : el?.inputValue)
                                )
                                dispatch(
                                    getFinancialProjection({
                                        client,
                                        input: {
                                            inputs: { ...defaultParams, ...object },
                                            s3_key: el?.s3Key,
                                        } as any,
                                        path: '/v1/analyze/analyze',
                                    })
                                )
                            }}
                        >
                            {el?.analysisName}
                        </Text>
                    </div>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    clickableText: {
        textDecorationLine: 'underline',
        fontSize: 16,
    },
    notActiveClickable: {
        textDecorationLine: 'underline',
        fontSize: 16,
        color: '#9bc39d',
    },
})

export { UserAnalyses }
