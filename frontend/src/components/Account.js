import {  TableRow, TableCell,  } from '@tremor/react'
import Currency from './Currency'

export default function Account({ account, areBalancesVisible }) {

    return (
        <TableRow>
            <TableCell className="items-center justify-center p-2.5 xl:p-5">
                {' '}
                <p className="text-black dark:text-white">{account.name}</p>
            </TableCell>
            <TableCell className="items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">
                     <Currency
                        amount={account.balances?.current}
                        currency={account.balances?.iso_currency_code}
                    /> 
                </p>
            </TableCell>
            <TableCell className="items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{account.subtype}</p>
            </TableCell>
            <TableCell className="items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">****{account.mask}</p>
            </TableCell>
        </TableRow>
    )
}
