import { useState, useEffect } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import {
    Table,
    TableHead,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    Title,
    DateRangePicker,
} from '@tremor/react'
import Transaction from './Transaction'
import Loader from '../components/common/Loader'
import { Button } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks'
import { getTransactionsAsync } from '../features/transactions'
import { useDataLoading } from '../hooks/useDataLoading'
import { MonthlySpending } from './common/MonthlySpending'
import { DailySpending } from './common/DailySpending'
import { SpendingDiff } from './common/SpendingDiff'
import { DatePickerCustom } from './common/DatePicker'
import { SpendingBarChart } from './common/SpendingBarChart'
const logger = new ConsoleLogger('Transactions')

export default function Transactions({ accounts = {} }) {
    const { id } = useParams()
    const client = generateClient()
    const dispatch = useAppDispatch()
    const cursor = useAppSelector((state) => state.transactions.cursor)
    const loading = useAppSelector((state) => state.transactions.loading)
    const { transactions } = useDataLoading({ id: id || '', client, loadTransactions: true })
    const dailySpendsLastXDays = useAppSelector((state) => state.transactions.dailySummaries)
    const monthlySpending = useAppSelector((state) => state.transactions.monthlySummaries)
    const handleLoadMore = async () => {
        try {
            await dispatch(getTransactionsAsync({ id: id || '', client, append: true }))
        } catch (err) {
            logger.error('unable to get transactions', err)
        }
    }

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <Title>Transactions</Title>
            <div className="flex justify-between">
                <SpendingDiff
                    dailySpending={dailySpendsLastXDays?.[0] ?? ([] as any)}
                    monthlySummaries={monthlySpending ?? []}
                />
                <DatePickerCustom />
            </div>
            <div id="container" className={`max-w-[100%] flex flex-row`}>
                <MonthlySpending width={50} />
                <DailySpending width={50} />
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Amount</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Account</TableHeaderCell>
                        <TableHeaderCell>Payment Channel</TableHeaderCell>
                        <TableHeaderCell>Transaction Type</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <Loader />
                            </TableCell>
                        </TableRow>
                    ) : transactions?.length ? (
                        transactions.map((transaction) => {
                            return (
                                <Transaction
                                    key={transaction.transaction_id}
                                    transaction={transaction}
                                    account={(accounts as any)[transaction?.account_id ?? '']}
                                />
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6}>Waiting for transaction data...</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {transactions?.length ? (
                <Button isDisabled={!cursor} onClick={handleLoadMore} size="small" variation="primary">
                    <CustomTextBox>Load More</CustomTextBox>
                </Button>
            ) : (
                <div />
            )}
        </div>
    )
}
