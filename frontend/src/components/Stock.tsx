import React from 'react'
import Currency from './Currency'
import { PercentChange } from './PercentChange'

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

    return (
        <div>
            <li className="flex w-full justify-between items-center py-1">
                <span className="flex-1 text-whiten">{name}</span>
                <PercentChange changePercent={changePercent} />
                <span className="flex-1 text-right text-whiten">
                    ➔ {parseFloat(valueChange) >= 0 ? 'up' : 'down'} <Currency amount={valueChange} />
                </span>
            </li>
        </div>
    )
}

export default Stock
