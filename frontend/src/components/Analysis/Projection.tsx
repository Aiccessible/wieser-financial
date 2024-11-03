import { getFinancialProjection } from '../../../src/features/analysis'
import { useAppDispatch, useAppSelector } from '../../..//src/hooks'
import { useDataLoading } from '../../..//src/hooks/useDataLoading'
import { Button } from '@aws-amplify/ui-react'
import { generateClient } from 'aws-amplify/api'
import { useParams } from 'react-router-dom'
import { CustomTextBox } from '../common/CustomTextBox'
import { calculateAverageSpendingFromMonthlySummarys } from '../common/spendingUtils'
import { useCallback, useEffect, useState } from 'react'
import { HighLevelTransactionCategory } from '../../../src/API'
import { calculateAverageTaxRate, identifyAccountType } from './PersonalFinance'
import { reduceAccounts } from '../../../src/features/accounts'
import * as Accordion from '@radix-ui/react-accordion'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { NetWorthChart } from './NetworthChart'

const Projection = () => {
    const { id } = useParams()
    const client = generateClient()
    const dispatch = useAppDispatch()
    const defaultParams = useDefaultValuesForProjection()
    const [inputs, setInputs] = useState(defaultParams)
    const projectedBalances = useAppSelector((state) => state.analysis.projectedAccountBalances)

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
            [name]: parseFloat(value),
        }))
    }

    const getProjection = () => {
        dispatch(
            getFinancialProjection({
                client,
                input: {
                    ...inputs,
                },
            })
        )
    }
    return (
        <div>
            <div className="flex col justify-between">
                <Accordion.Root type="multiple" className="w-full max-w-lg  p-4 border rounded-lg shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Accordion.Item value="salary" className="border-b">
                            <Accordion.Header className="py-2">
                                <Accordion.Trigger className="text-lg font-semibold">
                                    <CustomTextBox>Salary & Bonus</CustomTextBox>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-4 py-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Initial Salary</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="initial_salary"
                                        value={inputs.initial_salary.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Salary Growth (%)</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="salary_growth"
                                        value={inputs.salary_growth.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Initial Bonus</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="initial_bonus"
                                        value={inputs.initial_bonus.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Bonus Growth (%)</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="bonus_growth"
                                        value={inputs.bonus_growth.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
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
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Initial Expenses</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="initial_expenses"
                                        value={inputs.initial_expenses.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Expenses Growth (%)</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="expenses_growth"
                                        value={inputs.expenses_growth}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
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
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Investment Yield (%)</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="investment_yield"
                                        value={inputs.investment_yield.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        <CustomTextBox>Tax Rate (%)</CustomTextBox>
                                    </label>
                                    <input
                                        type="number"
                                        name="tax_rate"
                                        value={inputs.tax_rate.toFixed(2)}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
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
                            <Accordion.Content className="px-4 py-2 space-y-4">
                                {[
                                    'initial_rrsp_balance',
                                    'initial_fhsa_balance',
                                    'initial_tfsa_balance',
                                    'initial_brokerage_balance',
                                ].map((field) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium capitalize">
                                            {field.replace('initial_', '').replace(/_/g, ' ')}
                                        </label>
                                        <input
                                            type="number"
                                            name={field}
                                            value={(inputs as any)[field].toFixed(2)}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                ))}
                            </Accordion.Content>
                        </Accordion.Item>
                    </div>
                </Accordion.Root>
                <Button style={{ maxHeight: '100px' }} onClick={getProjection}>
                    <CustomTextBox>Get Projection</CustomTextBox>
                </Button>
            </div>
            {projectedBalances && <NetWorthChart accountBalances={projectedBalances} title="Networth Expirement" />}
        </div>
    )
}
export default Projection
