import { ConsoleLogger } from 'aws-amplify/utils';
import Account from './Account';
import {  Heading } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox';
import {  useAppSelector } from '../hooks'
import { ScrollView, Text, View } from 'react-native'
import { cssInterop } from 'nativewind';
import Protected from '../pages/Protected'
const StyledText = cssInterop(Text, {
    className: 'style',
})

const StyledView = cssInterop(View, {
    className: 'style',
})
const logger = new ConsoleLogger("Accounts");

export default function Accounts({ dontGrow }) {

  const loading = useAppSelector((state) => state.accounts.loading)
  const accounts = useAppSelector((state) => state.accounts.accounts);

  
  const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)
  return (
      <ScrollView
          className={
              dontGrow
                  ? 'flex w-1/2 flex-grow flex-col max-h-[35vh] overflow-auto hide-scrollbar bg-black'
                  : 'flex flex-grow flex-col overflow-auto hide-scrollbar bg-black'
          }
      >
          {!dontGrow && <Protected />}
          <StyledText level={6} className="text-2xl mb-1">
              <CustomTextBox className="flex flex-row items-center ">Account Summaries</CustomTextBox>
          </StyledText>
          {accounts?.length &&
              accounts.map((account) => {
                  return <Account areBalancesVisible={areBalancesVisible} key={account.account_id} account={account} />
              })}
      </ScrollView>
  )
}
