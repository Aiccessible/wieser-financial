import React from 'react'
import Currency from './Currency'
import { PercentChange } from './PercentChange'
import { Text, View } from 'react-native'
import { cssInterop } from 'nativewind'

const StyledText = Text

const StyledView = View
interface TreasuryYieldProps {
    todayPrice: number
    yesterdayPrice: number
    quantity: number
    name: string
}

const Stock: React.FC<TreasuryYieldProps> = ({ todayPrice, yesterdayPrice, quantity, name }) => {
    // Calculate the percentage change
    const changePercent = (((todayPrice - yesterdayPrice) / yesterdayPrice) * 100).toFixed(2)

    // Calculate the total change in value
    const valueChange = ((todayPrice - yesterdayPrice) * quantity).toFixed(2)
    console.info(name)
    return (
        <StyledView className="bg-blue">
            <StyledView className="flex w-full justify-between items-center py-1 flex-row">
                <StyledText
                    className="font-semibold text-white flex-1 flex-wrap"
                    numberOfLines={2} // Limit to 2 lines, text will wrap if too long
                    ellipsizeMode="tail" // Optional: Add ellipsis if it overflows
                >
                    {name}
                </StyledText>
                <PercentChange changePercent={changePercent} />
                <StyledText className={'text-right text-white'}>
                    ➔ {parseFloat(valueChange) >= 0 ? 'up' : 'down'} <Currency amount={valueChange} />
                </StyledText>
            </StyledView>
        </StyledView>
    )
}

export default Stock
