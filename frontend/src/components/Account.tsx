import Currency from './Currency'
import { CustomTextBox } from './common/CustomTextBox'
import { Account } from '../API'
import { useAppSelector } from '../hooks'
import { selectMostRecentNetWorth } from '../features/networth'
import { PercentChange } from './PercentChange'
import { getAccountBalanceMultipler } from '../features/accounts'
import { Text, View } from 'react-native'
import { cssInterop } from 'nativewind'

const StyledView = cssInterop(View, {
    className: 'style',
})
export default function AccountComponent({ account }: { account: Account }) {
    const mostRecentNetWorth = useAppSelector(selectMostRecentNetWorth)
    const oldBalances = JSON.parse(JSON.parse(mostRecentNetWorth.balances ?? '{}'))
    const lastAccountBal = parseFloat(account?.balances?.current ?? '0') * getAccountBalanceMultipler(account)
    const oldBal = oldBalances[account?.account_id ?? '']?.N ?? 0
    const change = (100 * (oldBal - lastAccountBal)) / oldBal

    return (
        <StyledView className="my-2 flex flex-row w-full px-2 items-center">
            <StyledView className="flex-1">
                <CustomTextBox className="w-full">{account.name}</CustomTextBox>
                <CustomTextBox className="w-full dark:text-whiten">
                    Current balance{' '}
                    <Currency
                        amount={account.balances?.current}
                        currency={account.balances?.iso_currency_code}
                    ></Currency>
                </CustomTextBox>
            </StyledView>
            <StyledView className="flex flex-col items-end">
                {oldBal && (
                    <CustomTextBox className="font-bold mb-2 w-24 text-right">
                        <PercentChange changePercent={change.toFixed(2)} />
                    </CustomTextBox>
                )}
            </StyledView>
        </StyledView>
    )
}
