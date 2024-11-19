import { TableCell, TableRow } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/Custom/CustomTextBox'
import { useState } from 'react'
import { useAppSelector } from '../hooks'
import { selectNetWorth } from '../features/accounts'

const Profile = () => {
    const [riskTolerance, setRiskTolerance] = useState('')
    const [expectedRetirementYear, setExpectedRetirementYear] = useState<number>()
    const [retirementYearError, setRetirementYearError] = useState<string>('')
    const networth = useAppSelector(selectNetWorth)
    const handleRiskToleranceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log('Risk tolerance changed:', e.target.value)
        setRiskTolerance(e.target.value)
    }

    const handleRetirementYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value

        if (input.length === 4) {
            console.log('Validating complete year:', input)
            const year = parseInt(input)
            const currentYear = new Date().getFullYear()

            if (isNaN(year)) {
                setRetirementYearError('Please enter a valid year')
                setExpectedRetirementYear(undefined)
                return
            }

            if (year <= currentYear) {
                setRetirementYearError('Retirement year must be in the future')
                setExpectedRetirementYear(undefined)
                return
            }

            if (year > currentYear + 100) {
                setRetirementYearError('Please enter a reasonable retirement year')
                setExpectedRetirementYear(undefined)
                return
            }

            setRetirementYearError('')
            setExpectedRetirementYear(year)
        } else if (input === '') {
            setRetirementYearError('')
            setExpectedRetirementYear(undefined)
        } else {
            setExpectedRetirementYear(parseInt(input))
        }
    }

    const monthlyChange = 5230.45
    const monthlyChangePercent = 2.1
    const ytdReturn = 12500.0
    const ytdReturnPercent = 5.0
    const overallReturn = 25000.0
    const overallReturnPercent = 10.0

    console.log('Monthly change:', monthlyChange, monthlyChangePercent)
    console.log('YTD return:', ytdReturn, ytdReturnPercent)
    console.log('Overall return:', overallReturn, overallReturnPercent)

    const getValueColor = (value: number) => {
        const color = value >= 0 ? 'text-emerald-500' : 'text-red-500'
        console.log('Value color for', value, ':', color)
        return color
    }

    const formatChange = (value: number, percent: number) => {
        const sign = value >= 0 ? '+' : ''
        const formatted = `${sign}$${Math.abs(value).toFixed(2)} (${sign}${percent}%)`
        console.log('Formatted change:', formatted)
        return formatted
    }

    return (
        <div className="w-full h-full rounded-xl shadow-lg p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">
                    <CustomTextBox>John Doe</CustomTextBox>
                </h1>
                <div className="grid gap-4 p-6 rounded-xl shadow-inner">
                    <div className="flex justify-between items-center border-b pb-3">
                        <span className="text-xl">
                            <CustomTextBox>Total Portfolio Value</CustomTextBox>
                        </span>
                        <span className="text-3xl font-bold">
                            <CustomTextBox>${networth}</CustomTextBox>
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm">
                                <CustomTextBox>Monthly Change</CustomTextBox>
                            </span>
                            <span className={`text-lg font-semibold ${getValueColor(monthlyChange)}`}>
                                <CustomTextBox>{formatChange(monthlyChange, monthlyChangePercent)}</CustomTextBox>
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm">
                                <CustomTextBox>YTD Return</CustomTextBox>
                            </span>
                            <span className={`text-lg font-semibold ${getValueColor(ytdReturn)}`}>
                                <CustomTextBox>{formatChange(ytdReturn, ytdReturnPercent)}</CustomTextBox>
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm">
                                <CustomTextBox>Overall Return</CustomTextBox>
                            </span>
                            <span className={`text-lg font-semibold ${getValueColor(overallReturn)}`}>
                                <CustomTextBox>{formatChange(overallReturn, overallReturnPercent)}</CustomTextBox>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">
                    <CustomTextBox>Investment Preferences</CustomTextBox>
                </h2>
                <div className="rounded-lg p-4 mb-6">
                    <p className="text-sm leading-relaxed">
                        Your investment style shapes your financial future. Conservative investors focus on preserving
                        capital through stable, low-risk investments like bonds and GICs. Moderate investors balance
                        growth and security with a mix of stocks and fixed-income securities. Aggressive investors
                        pursue maximum returns through growth-oriented investments, primarily stocks and alternative
                        assets.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <CustomTextBox>Risk Tolerance</CustomTextBox>
                        </label>
                        <select
                            className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all"
                            onChange={handleRiskToleranceChange}
                            value={riskTolerance}
                        >
                            <option value="">Select risk level</option>
                            <option value="conservative">Conservative</option>
                            <option value="moderate">Moderate</option>
                            <option value="aggressive">Aggressive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <CustomTextBox>Retiring Year</CustomTextBox>
                        </label>
                        <input
                            type="text"
                            pattern="\d*"
                            maxLength={4}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                                retirementYearError ? 'border-red-500' : ''
                            }`}
                            onChange={handleRetirementYearChange}
                            value={expectedRetirementYear || ''}
                            placeholder="Enter year (e.g. 2045)"
                        />
                        {retirementYearError && <p className="mt-1 text-sm text-red-500">{retirementYearError}</p>}
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4">
                    <CustomTextBox>Available Contribution Room</CustomTextBox>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <CustomTextBox>TFSA</CustomTextBox>
                        </label>
                        <input
                            type="number"
                            placeholder="$0.00"
                            className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-75"
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <CustomTextBox>RRSP</CustomTextBox>
                        </label>
                        <input
                            type="number"
                            placeholder="$0.00"
                            className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-75"
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <CustomTextBox>FHSA</CustomTextBox>
                        </label>
                        <input
                            type="number"
                            placeholder="$0.00"
                            className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-75"
                            disabled
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
