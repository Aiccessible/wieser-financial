import { TableRow } from '@aws-amplify/ui-react'
import { InvestmentViewModel } from './Investments'
import Currency from '../common/Custom/Currency'
import { CustomTableCell } from '../common/Custom/CustomTableCell'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import { InvestmentKnoweldgeViewModel } from '../../features/investments'
import { setActiveStock } from '../../features/investments'
import { useAppDispatch } from '../../hooks'
import { getIdFromSecurity } from '../../libs/utlis'
export default function Investment({
    investment,
    knoweldge,
}: {
    investment: InvestmentViewModel
    knoweldge: InvestmentKnoweldgeViewModel
}) {
    const dispatch = useAppDispatch()
    // Name, close, quantity, cost
    return (
        <TableRow>
            <CustomTableCell>
                <CustomTextBox className="underline mt-2">
                    <button className="underline" onClick={() => dispatch(setActiveStock(investment?.security))}>
                        {getIdFromSecurity(investment?.security) ?? 'Unknown Security'}
                    </button>
                </CustomTextBox>
            </CustomTableCell>
            <CustomTableCell>
                <CustomTextBox>
                    <Currency
                        amount={investment?.security?.close_price}
                        currency={investment?.security?.iso_currency_code}
                    />
                </CustomTextBox>
            </CustomTableCell>
            <CustomTableCell>
                <CustomTextBox>{investment.holding.quantity}</CustomTextBox>
            </CustomTableCell>
            <CustomTableCell>
                <CustomTextBox>{investment.holding.cost_basis}</CustomTextBox>
            </CustomTableCell>
        </TableRow>
    )
}
