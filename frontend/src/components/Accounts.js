import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { ConsoleLogger } from 'aws-amplify/utils';
import Account from './Account';
import {  Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox';
import {  useAppSelector } from '../hooks'

const logger = new ConsoleLogger("Accounts");

export default function Accounts({ updateAccounts }) {

  const loading = useAppSelector((state) => state.accounts.loading)
  const accounts = useAppSelector((state) => state.accounts.accounts);

  
  const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)
  return (
      <div className="flex w-1/2 flex-grow flex-col">
          <Heading level={6} className="text-2xl mb-1">
              <CustomTextBox className="flex flex-row items-center ">Account Summaries</CustomTextBox>
          </Heading>
          {accounts?.length &&
              accounts.map((account) => {
                  return <Account areBalancesVisible={areBalancesVisible} key={account.account_id} account={account} />
              })}
      </div>
  )
}
