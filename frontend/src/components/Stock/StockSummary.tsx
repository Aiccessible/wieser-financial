import { ConsoleLogger } from 'aws-amplify/utils'
import { Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import { useAppSelector } from '../../hooks'
import { StockPriceData, selectTopMovingStocks } from '../../features/investments'
import Stock from './Stock'
import Loader from '../common/Loader'

const logger = new ConsoleLogger('Accounts')

export default function StockSummary({}) {
    const stockData = useAppSelector(selectTopMovingStocks) as any as [string, Record<string, StockPriceData>][]
    const loading = useAppSelector((state) => state.investments.loadingStockPrices)
    console.log(stockData)
    return (
        <div className="flex w-1/2 flex-grow flex-col max-h-[35vh] overflow-auto hide-scrollbar">
            <Heading level={6} className="text-2xl mb-1">
                <CustomTextBox className="flex flex-row items-center ">Your Main Movers</CustomTextBox>
            </Heading>
            <Heading level={6} className="text-2xl mb-1"></Heading>
            {stockData?.length ? (
                stockData.map((data) => {
                    const priceData = Object.values(data?.[1] ?? {})?.[0]
                    return (
                        priceData && (
                            <Stock
                                todayPrice={priceData.price?.[0] ?? 0}
                                yesterdayPrice={priceData.price?.[1] ?? 0}
                                name={priceData?.security?.name ?? priceData?.security?.ticker_symbol ?? ''}
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
        </div>
    )
}
