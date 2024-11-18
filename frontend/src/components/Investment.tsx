import { TableRow } from '@aws-amplify/ui-react'
import { InvestmentViewModel } from './Investments'
import Currency from './Currency'
import { CustomTableCell } from './common/CustomTableCell'
import { CustomTextBox } from './common/CustomTextBox'
import { InvestmentKnoweldgeViewModel } from '../features/investments'
import { setActiveStock } from '../features/investments'
import { useAppDispatch } from '../hooks'
import { getIdFromSecurity } from '../libs/utlis'
import { TouchableOpacity, View, Text } from 'react-native'
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
        <View className="flex flex-row bg-black">
            <CustomTableCell>
                <CustomTextBox className="underline mt-2">
                    <TouchableOpacity
                        className="underline"
                        onPress={() => dispatch(setActiveStock(investment?.security))}
                    >
                        <Text
                            className="font-semibold text-white flex-1 flex-wrap"
                            numberOfLines={2} // Limit to 2 lines, text will wrap if too long
                            ellipsizeMode="tail" // Optional: Add ellipsis if it overflows
                        >
                            {investment?.security?.ticker_symbol ?? investment?.security?.name}
                        </Text>
                    </TouchableOpacity>
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
        </View>
    )
}
