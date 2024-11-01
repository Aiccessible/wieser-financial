import { useAppSelector } from '../hooks'
export default function Currency({ amount, currency = 'USD' }: any) {
    const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)

    if (!amount) {
        return '-'
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    return areBalancesVisible ? formatter.format(amount) : '***'
}
