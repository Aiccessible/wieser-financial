import { useState, useEffect, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import Account from './Account'
import { Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox'
import { useAppSelector } from '../hooks'
import { StockPriceData, selectTopMovingStocks } from '../features/investments'
import Stock from './Stock'
import Loader from './common/Loader'
import { Text, View } from 'react-native'
import { cssInterop } from 'nativewind'
const StyledText = cssInterop(Text, {
    className: 'style',
})
const StyledView = cssInterop(View, {
    className: 'style',
})
const logger = new ConsoleLogger('Accounts')

export default function StockSummary({}) {
    const stockData = useAppSelector(selectTopMovingStocks) as any as [string, Record<string, StockPriceData>][]
    const loading = useAppSelector((state) => state.investments.loadingStockPrices)
    console.log(stockData)
    return (
        <StyledView className="flex w-1/2 flex-grow flex-col max-h-[35vh] bg-blue overflow-auto hide-scrollbar">
            <StyledText className="text-2xl mb-1">
                <CustomTextBox className="flex flex-row items-center ">Your Main Movers</CustomTextBox>
            </StyledText>
            {stockData?.length ? (
                stockData.map((data) => {
                    const priceData = Object.values(data?.[1] ?? {})?.[0]
                    return (
                        priceData && (
                            <Stock
                                todayPrice={priceData.price?.[0] ?? 0}
                                yesterdayPrice={priceData.price?.[1] ?? 0}
                                name={priceData?.security?.ticker_symbol ?? priceData?.security?.name ?? ''}
                                quantity={priceData?.holding?.quantity ?? 0}
                            />
                        )
                    )
                })
            ) : loading ? (
                <Loader />
            ) : (
                <></>
            )}
        </StyledView>
    )
}
