import { TableCell, TableRow } from '@aws-amplify/ui-react'
import { InvestmentViewModel } from './Investments'
import Currency from './Currency'
import { CustomTableCell } from './common/CustomTableCell'
import { CustomTextBox } from './common/CustomTextBox'
import { InvestmentKnoweldgeViewModel } from '../features/investments'
import ExpandableTextWithModal from './ExpandableTextWithModal'
import { ChevronDownIcon, Loader } from 'lucide-react'
import Markdown from 'react-markdown'
import * as Accordion from '@radix-ui/react-accordion'
import { setActiveStock } from '../features/investments'
import { useAppDispatch } from '../hooks'
import { getIdFromSecurity } from '../libs/utlis'
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
                    <button
                        className="underline"
                        onClick={() => dispatch(setActiveStock(getIdFromSecurity(investment?.security)))}
                    >
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
