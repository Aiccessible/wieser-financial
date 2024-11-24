import { NetWorth } from '@/src/API'
import { greenShades } from '../common/Spending/Charts/Spending'
import { AccountBalances } from './NetworthChart'

export const prepareSeriesForTimeframe = (
    timeframe: string,
    accountBalances: AccountBalances,
    historicalNetWorth: NetWorth[],
    comparativeBalances?: AccountBalances,
    comparativeKey?: string
) => {
    const fhsas = historicalNetWorth.map((el) => parseFloat(el.fhsaNetWorth ?? ''))
    const rrsp = historicalNetWorth.map((el) => parseFloat(el.rrspNetWorth ?? ''))
    const tfsa = historicalNetWorth.map((el) => parseFloat(el.tfsaNetWorth ?? ''))
    const netWorth = historicalNetWorth.map((el) => parseFloat(el.netWorth ?? ''))

    switch (timeframe) {
        case '1 Year':
            return [
                { name: 'FHSA Net Worth (1 Year)', data: [], type: 'area', color: greenShades[0] },
                { name: 'RRSP Net Worth (1 Year)', data: [], type: 'area', color: greenShades[1] },
                { name: 'TFSA Net Worth (1 Year)', data: [], type: 'area', color: greenShades[2] },
                { name: 'Net Worth (1 Year)', data: [], fillOpacity: 0.3, color: greenShades[3] },
            ]
        case '2 Weeks':
            return [
                { name: 'FHSA Net Worth (2 Weeks)', data: fhsas, type: 'area', color: greenShades[0] },
                { name: 'RRSP Net Worth (2 Weeks)', data: rrsp, type: 'area', color: greenShades[1] },
                { name: 'TFSA Net Worth (2 Weeks)', data: tfsa, type: 'area', color: greenShades[0] },
                { name: 'Net Worth (2 Weeks)', data: netWorth, fillOpacity: 0.3, color: greenShades[2] },
            ]
        case 'Now':
            return [
                { name: 'FHSA Net Worth (Now)', data: [fhsas.at(-1)], type: 'area', color: greenShades[0] },
                { name: 'RRSP Net Worth (Now)', data: [rrsp.at(-1)], type: 'area', color: greenShades[1] },
                { name: 'TFSA Net Worth (Now)', data: [tfsa.at(-1)], type: 'area', color: greenShades[2] },
                { name: 'Net Worth (Now)', data: [netWorth.at(-1)], fillOpacity: 0.3, color: greenShades[3] },
            ]
        case 'Future':
            const entries = Object.entries(accountBalances)
            const compareData =
                comparativeKey && entries ? entries.filter((entry) => entry[0] === comparativeKey) : entries
            return compareData.map(([name, data], index) => ({
                name: `${name} (Future)`,
                data,
                type: 'area',
                fillOpacity: name === 'Net Worth' ? 0.3 : 0.1,
                color: greenShades[index % greenShades.length],
            }))
        default:
            return []
    }
}

export const getDateLabels = (timeframe: string, historicalNetWorth: NetWorth[]) => {
    switch (timeframe) {
        case '1 Year':
        case '2 Weeks':
            return historicalNetWorth.map((el) => new Date(el?.sk ?? 0).toDateString())
        case 'Now':
            return []
        case 'Future':
            return Array.from({ length: 12 }, (_, i) => `Year ${i + 1}`)
        default:
            return []
    }
}
