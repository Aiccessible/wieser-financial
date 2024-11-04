import { TableCell } from '@tremor/react'
import Currency from './Currency'
import { CustomTextBox } from './common/CustomTextBox'
import { Account } from '../API'
import { useAppSelector } from '../hooks'
import { selectMostRecentNetWorth } from '../features/networth'

export default function AccountComponent({ account }: { account: Account }) {
    const mostRecentNetWorth = useAppSelector(selectMostRecentNetWorth)
    const lastAccountBal = 0
    const oldBal = account?.balances?.current ? parseFloat(account?.balances?.current) : 0
    const classname = lastAccountBal > oldBal ? 'text-red-600' : 'text-green-600'

    return (
        <div className="my-2 flex flex-col">
            <div>
                <CustomTextBox>{account.name}</CustomTextBox>
                <CustomTextBox className="dark:text-whiten">
                    Current balance{' '}
                    <Currency
                        amount={account.balances?.current}
                        currency={account.balances?.iso_currency_code}
                    ></Currency>
                </CustomTextBox>
            </div>
            <div className="flex flex-col">
                <>
                    <CustomTextBox className="font-bold mb-2 flex flex-col">
                        {oldBal > lastAccountBal ? '+' : '-'}{' '}
                        <Currency amount={oldBal - lastAccountBal} currency={account.balances?.iso_currency_code} />%
                    </CustomTextBox>
                </>
            </div>
        </div>
    )
}
