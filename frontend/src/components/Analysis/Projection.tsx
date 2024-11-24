import { getFinancialProjection } from '../../../src/features/analysis'
import { useAppDispatch, useAppSelector } from '../../..//src/hooks'
import { useDataLoading } from '../../..//src/hooks/useDataLoading'
import { generateClient } from 'aws-amplify/api'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import { useEffect, useState } from 'react'
import * as Accordion from '../../components/native/Accordion'
import { financialProjectionKeys, useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { NetWorthChart } from './NetworthChart'
import { selectRegisteredSavingsPerAccounts } from '../../../src/features/transactions'
import { TextInput, View } from 'react-native'
import { NewInputsOverlay } from '../common/Overlay/NewInputsOverlay'
import Loader from '../common/Loader'
import { Button } from '@aws-amplify/ui-react'
import { getUserAnalysesAsync, getUserAnalysesFieldsAsync } from '../../../src/features/simulations'
import { useSimulatedExperiment } from '../../../src/hooks/useSimulatedExperiment'

const Projection = () => {
    const client = generateClient()
    const dispatch = useAppDispatch()
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const monthlySpendings = useAppSelector((state) => state.transactions.monthlySummaries)
    const generatingSimulation = useAppSelector((state) => state.analysis.generatingSimulation)
    const loadingProjection = useAppSelector((state) => state.analysis.loadingProjections)
    const estimatedSavings = useAppSelector(selectRegisteredSavingsPerAccounts)
    useDataLoading({
        loadTransactions: true,
        loadAccounts: true,
        loadProjection: true,
        id: 'v0',
        client: client,
    })
    const defaultParams = useDefaultValuesForProjection({
        accounts: accounts,
        monthlySpendings: monthlySpendings,
        estimatedSavings,
    })
    const newInputs = useAppSelector((state) => state.analysis.activeSimulationInputs)
    const newNewInputs = useAppSelector((state) => state.analysis.newSimulationInputs)

    const filteredInputs = newInputs?.filter((key) => !financialProjectionKeys.has(key as any))
    const analysisFields = useAppSelector((state) => state.simulations.analysisFields)

    const [inputs, setInputs] = useState({ ...defaultParams })
    console.info(inputs)
    useEffect(() => {
        const filteredInputsMap: Record<any, any> = {}
        analysisFields?.forEach((input) => {
            filteredInputsMap[input?.inputName ?? ''] = input?.inputValue
        })
        setInputs((inputs) => ({ ...inputs, ...filteredInputsMap }))
    }, [analysisFields])
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)
    const simulations = useAppSelector((state) => state.analysis.simulationProjections)
    const activeSimulationKey = useAppSelector((state) => state.analysis.activeSimulationKey)
    const activeSimulationName = useAppSelector((state) => state.analysis.activeSimulationName)
    const isWaiting = useAppSelector((state) => state.analysis.waitingForCodeGeneration)
    useEffect(() => {
        dispatch(getUserAnalysesAsync({ client }))
        dispatch(getUserAnalysesFieldsAsync({ client }))
    }, [])
    const error = useAppSelector((state) => state.analysis.loadingProjectionsError)
    useEffect(() => {
        setInputs((val) => ({
            ...val,
            ...defaultParams,
        }))
    }, [defaultParams])

    const handleInputChange = (e: any) => {
        const { name, value } = e.target
        setInputs((prevInputs) => ({
            ...prevInputs,
            [name]: value,
        }))
    }
    const getProjection = () => {
        const parsedInputs = Object.fromEntries(
            Object.entries(inputs).map(([key, value]) => {
                console.info(value, typeof value === 'string', parseFloat(value as any), typeof value)
                return [key, typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value]
            })
        ) as any
        dispatch(
            getFinancialProjection({
                client,
                input: {
                    ...parsedInputs,
                },
            })
        )
    }
    const { getProjection: getSimulationExperiment } = useSimulatedExperiment({ inputs })

    if (generatingSimulation || loadingProjection) {
        return (
            <div className="flex flex-1  justify-self-center bg-black">
                <Loader />
            </div>
        )
    }
    return (
        <div className="flex flex-1 flex-col bg-black">
            {newNewInputs && <NewInputsOverlay inputs={inputs} handleInputChange={handleInputChange} />}
            {error && (
                <CustomTextBox className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md mb-10">
                    <p className="font-bold text-red-700">Error:</p>
                    <p className="font-bold text-red-700">There was an issue loading the projection</p>
                </CustomTextBox>
            )}
            {isWaiting && (
                <CustomTextBox className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-md mb-10">
                    <p className="font-bold text-red-700">Regenerating simulation...</p>
                </CustomTextBox>
            )}

            <div className="flex  justify-between bg-black">
                <Accordion.Root
                    type="multiple"
                    className="w-full max-w-lg flex p-4 text-primary text-primary border rounded-lg shadow-md"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Accordion.Item value="salary" className="border-b">
                            <Accordion.Header className="py-2">
                                <Accordion.Trigger className="text-lg font-semibold">
                                    <CustomTextBox>Salary & Bonus</CustomTextBox>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-4 py-2 space-y-4">
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Initial Salary</CustomTextBox>
                                    </div>
                                    <TextInput
                                        keyboardType="numeric"
                                        value={inputs.initial_salary.toFixed(2)}
                                        onChangeText={(e) => handleInputChange({ name: 'initial_salary', value: e })}
                                    />
                                </div>
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Salary Growth (%)</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'salary_growth', value: e })}
                                        keyboardType="numeric"
                                        value={inputs.salary_growth.toFixed(2)}
                                    />
                                </div>
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Initial Bonus</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'initial_bonus', value: e })}
                                        keyboardType="numeric"
                                    />
                                </div>
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Bonus Growth (%)</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'bonus_growth', value: e })}
                                        keyboardType="numeric"
                                        value={inputs.bonus_growth.toFixed(2)}
                                    />
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>

                        <Accordion.Item value="expenses" className="border-b">
                            <Accordion.Header className="py-2">
                                <Accordion.Trigger className="text-lg font-semibold">
                                    <CustomTextBox>Expenses</CustomTextBox>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-4 py-2 space-y-4">
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Initial Expenses</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'initial_expenses', value: e })}
                                        keyboardType="numeric"
                                        value={inputs.initial_expenses.toFixed(2)}
                                    />
                                </div>
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Expenses Growth (%)</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'expenses_growth', value: e })}
                                        keyboardType="numeric"
                                        value={inputs.expenses_growth.toFixed(2)}
                                    />
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>

                        <Accordion.Item value="investments" className="border-b">
                            <Accordion.Header className="py-2">
                                <Accordion.Trigger className="text-lg font-semibold">
                                    <CustomTextBox>Investments</CustomTextBox>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-4 py-2 space-y-4">
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Investment Yield (%)</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'investment_yield', value: e })}
                                        keyboardType="numeric"
                                        value={inputs.investment_yield.toFixed(2)}
                                    />
                                </div>
                                <div>
                                    <div className="block text-sm font-medium">
                                        <CustomTextBox>Tax Rate (%)</CustomTextBox>
                                    </div>
                                    <TextInput
                                        onChangeText={(e) => handleInputChange({ name: 'tax_rate', value: e })}
                                        keyboardType="numeric"
                                        value={inputs.tax_rate.toFixed(2)}
                                    />
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>

                        <Accordion.Item value="accounts" className="border-b">
                            <Accordion.Header className="py-2">
                                <Accordion.Trigger className="text-lg font-semibold">
                                    <CustomTextBox>Accounts</CustomTextBox>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    'initial_rrsp_balance',
                                    'initial_rrsp_room',
                                    'initial_fhsa_balance',
                                    'initial_fhsa_room',
                                    'initial_tfsa_balance',
                                    'initial_tfsa_room',
                                    'initial_brokerage_balance',
                                ].map((field) => (
                                    <div key={field}>
                                        <div className="block text-sm font-medium capitalize">
                                            <CustomTextBox>
                                                {field.replace('initial_', '').replace(/_/g, ' ')}
                                            </CustomTextBox>
                                        </div>
                                        <TextInput
                                            onChangeText={(e) => handleInputChange({ name: field, value: e })}
                                            keyboardType="numeric"
                                            value={(inputs as any)[field]}
                                        />
                                    </div>
                                ))}
                            </Accordion.Content>
                        </Accordion.Item>
                        <div className="col-span-2">
                            {filteredInputs && (
                                <Accordion.Item value="Wieser Inputs" className="border-b">
                                    <Accordion.Header className="py-2">
                                        <Accordion.Trigger className="text-lg font-semibold">
                                            <CustomTextBox>Wieser Inputs</CustomTextBox>
                                        </Accordion.Trigger>
                                    </Accordion.Header>
                                    <Accordion.Content className="px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredInputs.map((field) => (
                                            <div key={field}>
                                                <div className="block text-sm font-medium capitalize">
                                                    <CustomTextBox>{field?.replace(/_/g, ' ')}</CustomTextBox>
                                                </div>
                                                <TextInput
                                                    onChangeText={(e) =>
                                                        handleInputChange({ target: { name: field, value: e } })
                                                    }
                                                    keyboardType="numeric"
                                                    value={(inputs as any)[field]}
                                                />
                                            </div>
                                        ))}
                                    </Accordion.Content>
                                </Accordion.Item>
                            )}
                        </div>
                    </div>
                </Accordion.Root>
                <Button
                    style={{ marginTop: 10, maxHeight: 120 }}
                    className="bg-gradient-to-r text-center bg-primary active:scale-95 text-black py-4 px-6 rounded-lg shadow-lg transform transition duration-300 hover:bg-green-700 ease-in-out mt-4"
                    onClick={activeSimulationName ? getSimulationExperiment : getProjection}
                    isLoading={isWaiting}
                >
                    <p className="text-xl text-center font-bold tracking-wider text-black ">Run Wieser Simulation</p>
                </Button>
            </div>
            {projectedBalances && simulations?.[activeSimulationKey ?? ''] && (
                <View style={{ marginTop: 10 }}>
                    <NetWorthChart
                        comparativeBalances={simulations?.[activeSimulationKey ?? '']}
                        comparativeKey="Net Worth"
                        overrideTimeFrame={'Future'}
                        accountBalances={projectedBalances}
                        title="Simulation"
                    />
                </View>
            )}

            {projectedBalances && !simulations?.[activeSimulationKey ?? ''] && (
                <NetWorthChart accountBalances={projectedBalances} title="Networth Experiment" />
            )}
        </div>
    )
}
export default Projection
