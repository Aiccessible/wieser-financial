import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import Account from './Account';
import Loader from '../components/common/Loader'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Title } from '@tremor/react'
import { CustomTextBox } from './common/CustomTextBox';
import {  useAppSelector } from '../hooks'

const logger = new ConsoleLogger("Accounts");

export default function Accounts({ updateAccounts }) {

  const loading = useAppSelector((state) => state.accounts.loading)
  const accounts = useAppSelector((state) => state.accounts.accounts);

  
  const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)
  return (
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 overflow-x-scroll">
          <Title><CustomTextBox>Accounts</CustomTextBox></Title>
          <Table highlightOnHover={true} >
              <TableHead>
                  <TableRow>
                      <TableHeaderCell><CustomTextBox>Name</CustomTextBox></TableHeaderCell>
                      <TableHeaderCell><CustomTextBox>Balances</CustomTextBox></TableHeaderCell>
                      <TableHeaderCell><CustomTextBox>Type</CustomTextBox></TableHeaderCell>
                      <TableHeaderCell><CustomTextBox>Mask</CustomTextBox></TableHeaderCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                  {loading ? (
                      <TableRow>
                          <TableCell>
                              <Loader />
                          </TableCell>
                      </TableRow>
                  ) : accounts?.length && (
                      accounts.map((account) => {
                          return <Account areBalancesVisible={areBalancesVisible} key={account.account_id} account={account} />
                      })
                  )}
              </TableBody>
          </Table>
      </div>
  )
}
