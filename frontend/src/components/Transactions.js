import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Title } from '@tremor/react'
import Transaction from './Transaction';
import { Loader, View } from 'lucide-react';
import { Button } from '@aws-amplify/ui-react';
import { CustomTextBox } from './common/CustomTextBox';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getTransactionsAsync } from '../features/transactions';

const logger = new ConsoleLogger("Transactions");

export default function Transactions({  accounts = {} }) {

  const { id } = useParams();
  const client = generateClient();
  const dispatch = useAppDispatch()
  const transactions = useAppSelector(state => state.transactions.transactions)
  const cursor = useAppSelector((state) => state.transactions.cursor)
  const loading = useAppSelector((state) => state.transactions.loading)
  const getTransactions = async () => {
    try {
      await dispatch(getTransactionsAsync({ id, client }))
    } catch (err) {
      logger.error('unable to get transactions', err);
    }
  }

  const handleLoadMore = async () => {
    try {
       await dispatch(getTransactionsAsync({ id, client, append: true }))
    } catch (err) {
      logger.error('unable to get transactions', err);
    }
  }

  useEffect(() => {
    (!transactions || !transactions.length) && getTransactions();
  }, [transactions]);

  return (
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <Title>Transactions</Title>
          <Table>
              <TableHead>
                  <TableRow>
                      <TableHeaderCell as="th">Name</TableHeaderCell>
                      <TableHeaderCell as="th">Amount</TableHeaderCell>
                      <TableHeaderCell as="th">Date</TableHeaderCell>
                      <TableHeaderCell as="th">Account</TableHeaderCell>
                      <TableHeaderCell as="th">Payment Channel</TableHeaderCell>
                      <TableHeaderCell as="th">Transaction Type</TableHeaderCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                  {loading ? (
                      <TableRow>
                          <TableCell colSpan="6">
                              <Loader />
                          </TableCell>
                      </TableRow>
                  ) : transactions.length ? (
                      transactions.map((transaction) => {
                          return (
                              <Transaction
                                  key={transaction.transaction_id}
                                  transaction={transaction}
                                  account={accounts[transaction.account_id]}
                              />
                          )
                      })
                  ) : (
                      <TableRow>
                          <TableCell colSpan="6">Waiting for transaction data...</TableCell>
                      </TableRow>
                  )}
              </TableBody>
          </Table>
          {transactions.length ? (
              <Button isDisabled={!cursor} onClick={handleLoadMore} size="small" variable="primary">
                  <CustomTextBox>Load More</CustomTextBox>
              </Button>
          ) : (
              <div />
          )}
      </div>
  )
}
