import { TableCell, TableRow } from '@aws-amplify/ui-react'
import { InvestmentViewModel } from './Investments'
import Currency from './Currency'
import { CustomTableCell } from './common/CustomTableCell'
import { CustomTextBox } from './common/CustomTextBox'
export default function Investment({ investment }: { investment: InvestmentViewModel }) {
    // Name, close, quantity, cost
    return (
        <TableRow>
            <CustomTableCell>
                <CustomTextBox>
                    {investment.security?.ticker_symbol ?? investment?.security?.name ?? 'Unknown Security'}
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
